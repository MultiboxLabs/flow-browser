import { getDatastore } from "@/saving/datastore";
import { getSettingValueById } from "@/saving/settings";
import { ArchiveTabValueMap, SleepTabValueMap } from "@/modules/basic-settings";
import { getCurrentTimestamp } from "@/modules/utils";
import { PersistedTabData, PersistedTabGroupData } from "~/types/tabs";
import { migrateTabData } from "./serialization";

// DataStore instances
const TabsDataStore = getDatastore("tabs");
const TabGroupsDataStore = getDatastore("tabgroups");

// Flush interval in milliseconds
const FLUSH_INTERVAL_MS = 2000;

/**
 * Manages persistence of tabs and tab groups to disk.
 *
 * Key design decisions:
 * - Dirty-tracking: only tabs that have changed since the last flush are written
 * - Batch flush: all dirty tabs are written in a single `setMany` call every ~2s
 * - Tab groups are written immediately since they change infrequently
 * - flush() can be called synchronously at quit time to ensure no data is lost
 */
export class TabPersistenceManager {
  /** Set of tab uniqueIds that have been modified since last flush */
  private dirtyTabs = new Map<string, PersistedTabData>();

  /** Set of tab uniqueIds that have been removed since last flush */
  private removedTabs = new Set<string>();

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
   * Remove a tab from storage immediately.
   * Used when we need the removal to happen right away (e.g., archiving).
   */
  async removeTab(uniqueId: string): Promise<void> {
    this.dirtyTabs.delete(uniqueId);
    this.removedTabs.delete(uniqueId);
    await TabsDataStore.remove(uniqueId);
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
    this.dirtyTabs.clear();
    this.removedTabs.clear();

    // Skip if nothing to do
    if (dirtyEntries.size === 0 && removedEntries.size === 0) return;

    // Write dirty tabs in batch
    if (dirtyEntries.size > 0) {
      const entries: Record<string, PersistedTabData> = {};
      for (const [uniqueId, data] of dirtyEntries) {
        entries[uniqueId] = data;
      }
      await TabsDataStore.setMany(entries);
    }

    // Remove deleted tabs
    const removePromises: Promise<boolean>[] = [];
    for (const uniqueId of removedEntries) {
      removePromises.push(TabsDataStore.remove(uniqueId));
    }
    if (removePromises.length > 0) {
      await Promise.all(removePromises);
    }
  }

  // --- Load methods (used at startup) ---

  /**
   * Load all persisted tabs from storage, applying schema migrations as needed.
   */
  async loadAllTabs(): Promise<PersistedTabData[]> {
    const rawData = await TabsDataStore.getFullData();
    const tabs: PersistedTabData[] = [];

    for (const [, value] of Object.entries(rawData)) {
      try {
        const migrated = migrateTabData(value as Record<string, unknown>);
        tabs.push(migrated);
      } catch (err) {
        console.error("[TabPersistenceManager] Failed to migrate tab data:", err);
      }
    }

    return tabs;
  }

  /**
   * Load all persisted tab groups from storage.
   */
  async loadAllTabGroups(): Promise<PersistedTabGroupData[]> {
    const rawData = await TabGroupsDataStore.getFullData();
    const groups: PersistedTabGroupData[] = [];

    for (const [, value] of Object.entries(rawData)) {
      try {
        groups.push(value as PersistedTabGroupData);
      } catch (err) {
        console.error("[TabPersistenceManager] Failed to load tab group data:", err);
      }
    }

    return groups;
  }

  // --- Tab Group persistence ---

  /**
   * Save a tab group to storage immediately.
   * Tab groups change infrequently so we don't batch them.
   */
  async saveTabGroup(groupId: string, data: PersistedTabGroupData): Promise<void> {
    await TabGroupsDataStore.set(groupId, data);
  }

  /**
   * Remove a tab group from storage immediately.
   */
  async removeTabGroup(groupId: string): Promise<void> {
    await TabGroupsDataStore.remove(groupId);
  }

  /**
   * Wipe all tab groups from storage.
   */
  async wipeTabGroups(): Promise<void> {
    await TabGroupsDataStore.wipe();
  }

  // --- Storage wipe ---

  /**
   * Wipe all tabs and tab groups from storage.
   */
  async wipeAll(): Promise<void> {
    this.dirtyTabs.clear();
    this.removedTabs.clear();
    await Promise.all([TabsDataStore.wipe(), TabGroupsDataStore.wipe()]);
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
