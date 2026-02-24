import { getDb, schema } from "@/saving/db";
import { getSettingValueById } from "@/saving/settings";
import { ArchiveTabValueMap, SleepTabValueMap } from "@/modules/basic-settings";
import { getCurrentTimestamp } from "@/modules/utils";
import { PersistedTabData, PersistedTabGroupData, PersistedWindowState } from "~/types/tabs";
import { eq } from "drizzle-orm";
import { TabRow, TabGroupRow, WindowStateRow, TabInsert, TabGroupInsert, WindowStateInsert } from "@/saving/db/schema";

// Flush interval in milliseconds
const FLUSH_INTERVAL_MS = 2000;

// --- Row <-> Domain Object Converters ---

function tabRowToPersistedData(row: TabRow): PersistedTabData {
  return {
    schemaVersion: row.schemaVersion,
    uniqueId: row.uniqueId,
    createdAt: row.createdAt,
    lastActiveAt: row.lastActiveAt,
    position: row.position,
    profileId: row.profileId,
    spaceId: row.spaceId,
    windowGroupId: row.windowGroupId,
    title: row.title,
    url: row.url,
    faviconURL: row.faviconUrl,
    muted: row.muted,
    navHistory: row.navHistory,
    navHistoryIndex: row.navHistoryIndex
  };
}

function persistedDataToTabInsert(data: PersistedTabData): TabInsert {
  return {
    uniqueId: data.uniqueId,
    schemaVersion: data.schemaVersion,
    createdAt: data.createdAt,
    lastActiveAt: data.lastActiveAt,
    position: data.position,
    profileId: data.profileId,
    spaceId: data.spaceId,
    windowGroupId: data.windowGroupId,
    title: data.title,
    url: data.url,
    faviconUrl: data.faviconURL,
    muted: data.muted,
    navHistory: data.navHistory,
    navHistoryIndex: data.navHistoryIndex
  };
}

function tabGroupRowToPersistedData(row: TabGroupRow): PersistedTabGroupData {
  return {
    groupId: row.groupId,
    mode: row.mode,
    profileId: row.profileId,
    spaceId: row.spaceId,
    tabUniqueIds: row.tabUniqueIds,
    glanceFrontTabUniqueId: row.glanceFrontTabUniqueId ?? undefined,
    position: row.position
  };
}

function persistedDataToTabGroupInsert(data: PersistedTabGroupData): TabGroupInsert {
  return {
    groupId: data.groupId,
    mode: data.mode,
    profileId: data.profileId,
    spaceId: data.spaceId,
    tabUniqueIds: data.tabUniqueIds,
    glanceFrontTabUniqueId: data.glanceFrontTabUniqueId ?? null,
    position: data.position
  };
}

function windowStateRowToPersistedData(row: WindowStateRow): PersistedWindowState {
  return {
    width: row.width,
    height: row.height,
    x: row.x ?? undefined,
    y: row.y ?? undefined,
    isPopup: row.isPopup ?? undefined
  };
}

function persistedDataToWindowStateInsert(windowGroupId: string, data: PersistedWindowState): WindowStateInsert {
  return {
    windowGroupId,
    width: data.width,
    height: data.height,
    x: data.x ?? null,
    y: data.y ?? null,
    isPopup: data.isPopup ?? null
  };
}

/**
 * Manages persistence of tabs and tab groups to disk.
 *
 * Key design decisions:
 * - Dirty-tracking: only tabs that have changed since the last flush are written
 * - Batch flush: all dirty tabs are written in a single transaction every ~2s
 * - Tab groups are written immediately since they change infrequently
 * - flush() can be called synchronously at quit time to ensure no data is lost
 */
export class TabPersistenceManager {
  /** Set of tab uniqueIds that have been modified since last flush */
  private dirtyTabs = new Map<string, PersistedTabData>();

  /** Set of tab uniqueIds that have been removed since last flush */
  private removedTabs = new Set<string>();

  /** Window states that have been modified since last flush */
  private dirtyWindowStates = new Map<string, PersistedWindowState>();

  /** Periodic flush interval handle */
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  /** Whether the manager has been started */
  private started = false;

  /**
   * Start the periodic flush timer.
   * Should be called once during app startup.
   */
  start(): void {
    if (this.started) return;
    this.started = true;

    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        console.error("[TabPersistenceManager] Periodic flush failed:", err);
      });
    }, FLUSH_INTERVAL_MS);
  }

  /**
   * Stop the periodic flush timer and do a final flush.
   * Should be called during app shutdown.
   */
  async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.started = false;
    await this.flush();
  }

  /**
   * Mark a tab as dirty with its current serialized data.
   * The data will be written to disk on the next flush cycle.
   */
  markDirty(uniqueId: string, data: PersistedTabData): void {
    // If the tab was previously marked for removal, cancel that
    this.removedTabs.delete(uniqueId);
    this.dirtyTabs.set(uniqueId, data);
  }

  /**
   * Mark a tab for removal from storage.
   * The removal will be applied on the next flush cycle.
   */
  markRemoved(uniqueId: string): void {
    this.dirtyTabs.delete(uniqueId);
    this.removedTabs.add(uniqueId);
  }

  /**
   * Mark a window's state as dirty with its current bounds.
   * The data will be written to disk on the next flush cycle.
   */
  markWindowStateDirty(windowGroupId: string, state: PersistedWindowState): void {
    this.dirtyWindowStates.set(windowGroupId, state);
  }

  /**
   * Remove a tab from storage immediately.
   * Used when we need the removal to happen right away (e.g., archiving).
   */
  async removeTab(uniqueId: string): Promise<void> {
    this.dirtyTabs.delete(uniqueId);
    this.removedTabs.delete(uniqueId);

    const db = getDb();
    db.delete(schema.tabs).where(eq(schema.tabs.uniqueId, uniqueId)).run();
  }

  /**
   * Flush all pending changes to disk.
   * - Writes all dirty tabs in a single batch
   * - Removes all tabs marked for deletion
   * - Clears the dirty/removed sets after successful write
   */
  async flush(): Promise<void> {
    // Snapshot and clear the pending changes so new mutations during flush
    // are captured in the next cycle
    const dirtyEntries = new Map(this.dirtyTabs);
    const removedEntries = new Set(this.removedTabs);
    const dirtyWindowEntries = new Map(this.dirtyWindowStates);
    this.dirtyTabs.clear();
    this.removedTabs.clear();
    this.dirtyWindowStates.clear();

    // Skip if nothing to do
    if (dirtyEntries.size === 0 && removedEntries.size === 0 && dirtyWindowEntries.size === 0) return;

    const db = getDb();

    try {
      // Use a transaction for atomicity
      db.transaction((tx) => {
        // Upsert dirty tabs
        for (const [, data] of dirtyEntries) {
          const insert = persistedDataToTabInsert(data);
          tx.insert(schema.tabs)
            .values(insert)
            .onConflictDoUpdate({
              target: schema.tabs.uniqueId,
              set: {
                schemaVersion: insert.schemaVersion,
                createdAt: insert.createdAt,
                lastActiveAt: insert.lastActiveAt,
                position: insert.position,
                profileId: insert.profileId,
                spaceId: insert.spaceId,
                windowGroupId: insert.windowGroupId,
                title: insert.title,
                url: insert.url,
                faviconUrl: insert.faviconUrl,
                muted: insert.muted,
                navHistory: insert.navHistory,
                navHistoryIndex: insert.navHistoryIndex
              }
            })
            .run();
        }

        // Remove deleted tabs
        for (const uniqueId of removedEntries) {
          tx.delete(schema.tabs).where(eq(schema.tabs.uniqueId, uniqueId)).run();
        }

        // Upsert dirty window states
        for (const [windowGroupId, state] of dirtyWindowEntries) {
          const insert = persistedDataToWindowStateInsert(windowGroupId, state);
          tx.insert(schema.windowStates)
            .values(insert)
            .onConflictDoUpdate({
              target: schema.windowStates.windowGroupId,
              set: {
                width: insert.width,
                height: insert.height,
                x: insert.x,
                y: insert.y,
                isPopup: insert.isPopup
              }
            })
            .run();
        }
      });
    } catch (error) {
      // Requeue snapshot entries so failures are retried on the next flush.
      // Preserve newer mutations that may have happened while writes were in flight.
      for (const [uniqueId, data] of dirtyEntries) {
        if (!this.dirtyTabs.has(uniqueId) && !this.removedTabs.has(uniqueId)) {
          this.dirtyTabs.set(uniqueId, data);
        }
      }

      for (const uniqueId of removedEntries) {
        if (!this.dirtyTabs.has(uniqueId)) {
          this.removedTabs.add(uniqueId);
        }
      }

      for (const [windowGroupId, state] of dirtyWindowEntries) {
        if (!this.dirtyWindowStates.has(windowGroupId)) {
          this.dirtyWindowStates.set(windowGroupId, state);
        }
      }

      throw error;
    }
  }

  // --- Load methods (used at startup) ---

  /**
   * Load all persisted tabs from storage.
   */
  async loadAllTabs(): Promise<PersistedTabData[]> {
    const db = getDb();
    const rows = db.select().from(schema.tabs).all();
    return rows.map(tabRowToPersistedData);
  }

  /**
   * Load all persisted tab groups from storage.
   */
  async loadAllTabGroups(): Promise<PersistedTabGroupData[]> {
    const db = getDb();
    const rows = db.select().from(schema.tabGroups).all();
    return rows.map(tabGroupRowToPersistedData);
  }

  /**
   * Load all persisted window states from storage.
   * Returns a map of windowGroupId -> PersistedWindowState.
   *
   * Wipes the store after loading so stale entries from closed windows
   * don't accumulate. The current session's resize/move handlers will
   * re-populate it with fresh data.
   */
  async loadAllWindowStates(): Promise<Map<string, PersistedWindowState>> {
    const db = getDb();
    const rows = db.select().from(schema.windowStates).all();
    const states = new Map<string, PersistedWindowState>();

    for (const row of rows) {
      states.set(row.windowGroupId, windowStateRowToPersistedData(row));
    }

    // Wipe after loading so closed windows don't leave stale entries
    db.delete(schema.windowStates).run();

    return states;
  }

  // --- Tab Group persistence ---

  /**
   * Save a tab group to storage immediately.
   * Tab groups change infrequently so we don't batch them.
   */
  async saveTabGroup(_groupId: string, data: PersistedTabGroupData): Promise<void> {
    const db = getDb();
    const insert = persistedDataToTabGroupInsert(data);

    db.insert(schema.tabGroups)
      .values(insert)
      .onConflictDoUpdate({
        target: schema.tabGroups.groupId,
        set: {
          mode: insert.mode,
          profileId: insert.profileId,
          spaceId: insert.spaceId,
          tabUniqueIds: insert.tabUniqueIds,
          glanceFrontTabUniqueId: insert.glanceFrontTabUniqueId,
          position: insert.position
        }
      })
      .run();
  }

  /**
   * Remove a tab group from storage immediately.
   */
  async removeTabGroup(groupId: string): Promise<void> {
    const db = getDb();
    db.delete(schema.tabGroups).where(eq(schema.tabGroups.groupId, groupId)).run();
  }

  /**
   * Wipe all tab groups from storage.
   */
  async wipeTabGroups(): Promise<void> {
    const db = getDb();
    db.delete(schema.tabGroups).run();
  }

  // --- Storage wipe ---

  /**
   * Wipe all tabs and tab groups from storage.
   */
  async wipeAll(): Promise<void> {
    this.dirtyTabs.clear();
    this.removedTabs.clear();
    this.dirtyWindowStates.clear();

    const db = getDb();
    db.transaction((tx) => {
      tx.delete(schema.tabs).run();
      tx.delete(schema.tabGroups).run();
      tx.delete(schema.windowStates).run();
    });
  }
}

// Singleton instance
export const tabPersistenceManager = new TabPersistenceManager();

// --- Settings-based helpers (re-exported for convenience) ---

/**
 * Determines if a tab should be archived based on its lastActiveAt timestamp
 * and the user's archive setting.
 */
export function shouldArchiveTab(lastActiveAt: number): boolean {
  const archiveTabAfter = getSettingValueById("archiveTabAfter");
  const archiveTabAfterSeconds = ArchiveTabValueMap[archiveTabAfter as keyof typeof ArchiveTabValueMap];

  if (typeof archiveTabAfterSeconds !== "number") return false;

  const now = getCurrentTimestamp();
  const diff = now - lastActiveAt;
  return diff > archiveTabAfterSeconds;
}

/**
 * Determines if a tab should be put to sleep based on its lastActiveAt timestamp
 * and the user's sleep setting.
 */
export function shouldSleepTab(lastActiveAt: number): boolean {
  const sleepTabAfter = getSettingValueById("sleepTabAfter");
  const sleepTabAfterSeconds = SleepTabValueMap[sleepTabAfter as keyof typeof SleepTabValueMap];

  if (typeof sleepTabAfterSeconds !== "number") return false;

  const now = getCurrentTimestamp();
  const diff = now - lastActiveAt;
  return diff > sleepTabAfterSeconds;
}
