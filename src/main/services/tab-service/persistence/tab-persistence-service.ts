import { getDb, schema } from "@/saving/db";
import { eq } from "drizzle-orm";
import {
  PersistedTabData,
  PersistedTabLayoutNodeData,
  PersistedWindowState,
  TAB_SERVICE_SCHEMA_VERSION,
  NavigationEntry
} from "~/types/tab-service";
import { Tab, SLEEP_MODE_URL } from "../core/tab";
import { TabLayoutNode } from "../core/tab-layout-node";
import { TabService } from "../tab-service";

const FLUSH_INTERVAL_MS = 2000;

/**
 * Strips sleep mode entries from navigation history.
 * These are synthetic entries from older versions.
 */
function stripSleepEntries(
  navHistory: NavigationEntry[],
  navHistoryIndex: number
): { navHistory: NavigationEntry[]; navHistoryIndex: number } {
  const filtered: NavigationEntry[] = [];
  let removedBeforeIndex = 0;

  for (let i = 0; i < navHistory.length; i++) {
    if (navHistory[i].url === SLEEP_MODE_URL) {
      if (i <= navHistoryIndex) removedBeforeIndex++;
      continue;
    }
    filtered.push(navHistory[i]);
  }

  let adjustedIndex = navHistoryIndex - removedBeforeIndex;
  if (filtered.length === 0) return { navHistory: [], navHistoryIndex: 0 };
  adjustedIndex = Math.max(0, Math.min(adjustedIndex, filtered.length - 1));

  return { navHistory: filtered, navHistoryIndex: adjustedIndex };
}

/**
 * TabPersistenceService — handles saving and restoring tabs to/from the database.
 *
 * Key design:
 * - Dirty-tracking: only modified tabs are written
 * - Batch flush: all dirty tabs written in a single transaction every ~2s
 * - Immediate writes for pinned tabs (change infrequently)
 */
export class TabPersistenceService {
  private dirtyTabs = new Map<string, PersistedTabData>();
  private removedTabs = new Set<string>();
  private dirtyWindowStates = new Map<string, PersistedWindowState>();
  private layoutNodesDirty = false;
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private started = false;

  constructor(private readonly tabService: TabService) {}

  // --- Lifecycle ---

  public start(): void {
    if (this.started) return;
    this.started = true;

    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        console.error("[TabPersistenceService] Flush failed:", err);
      });
    }, FLUSH_INTERVAL_MS);

    // Listen for tab events
    this.tabService.on("tab-created", (tab) => this.onTabChanged(tab));
    this.tabService.on("content-change", (_windowId, tabId) => {
      const tab = this.tabService.tabs.get(tabId);
      if (tab) this.onTabChanged(tab);
    });
    this.tabService.on("tab-removed", (tab) => {
      if (tab.owner.kind === "normal") {
        this.markRemoved(tab.uniqueId);
      }
    });
    this.tabService.on("structural-change", () => {
      this.markLayoutNodesDirty();
    });
  }

  public async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.started = false;
    await this.flush();
  }

  // --- Dirty Tracking ---

  private onTabChanged(tab: Tab): void {
    if (tab.owner.kind !== "normal") {
      // Ephemeral tabs (pinned/bookmark-owned) are not persisted.
      // Remove any stale DB record from when this tab was still "normal".
      this.markRemoved(tab.uniqueId);
      return;
    }
    const serialized = this.serializeTab(tab);
    this.dirtyTabs.set(tab.uniqueId, serialized);
    this.removedTabs.delete(tab.uniqueId);
  }

  public markRemoved(uniqueId: string): void {
    this.dirtyTabs.delete(uniqueId);
    this.removedTabs.add(uniqueId);
  }

  public markWindowStateDirty(windowGroupId: string, state: PersistedWindowState): void {
    this.dirtyWindowStates.set(windowGroupId, state);
  }

  public markLayoutNodesDirty(): void {
    this.layoutNodesDirty = true;
  }

  // --- Flush ---

  public async flush(): Promise<void> {
    if (
      this.dirtyTabs.size === 0 &&
      this.removedTabs.size === 0 &&
      this.dirtyWindowStates.size === 0 &&
      !this.layoutNodesDirty
    ) {
      return;
    }

    // Snapshot and clear atomically before the transaction.
    // Any mutations that arrive during the synchronous transaction go into
    // fresh maps and are preserved for the next flush cycle.
    const dirtySnapshot = new Map(this.dirtyTabs);
    this.dirtyTabs.clear();
    const removedSnapshot = new Set(this.removedTabs);
    this.removedTabs.clear();
    const windowSnapshot = new Map(this.dirtyWindowStates);
    this.dirtyWindowStates.clear();
    const layoutNodesDirtySnapshot = this.layoutNodesDirty;
    this.layoutNodesDirty = false;

    try {
      const db = getDb();
      db.transaction((tx) => {
        // Upsert dirty tabs
        for (const [, data] of dirtySnapshot) {
          const insert = this.persistedDataToInsert(data);
          tx.insert(schema.tabs)
            .values(insert)
            .onConflictDoUpdate({
              target: schema.tabs.uniqueId,
              set: insert
            })
            .run();
        }

        // Remove deleted tabs
        for (const uniqueId of removedSnapshot) {
          tx.delete(schema.tabs).where(eq(schema.tabs.uniqueId, uniqueId)).run();
        }

        // Upsert window states
        for (const [windowGroupId, state] of windowSnapshot) {
          const insert = {
            windowGroupId,
            width: state.width,
            height: state.height,
            x: state.x ?? null,
            y: state.y ?? null,
            isPopup: state.isPopup ?? null
          };
          tx.insert(schema.windowStates)
            .values(insert)
            .onConflictDoUpdate({
              target: schema.windowStates.windowGroupId,
              set: insert
            })
            .run();
        }

        if (layoutNodesDirtySnapshot) {
          tx.delete(schema.tabGroups).run();

          for (const node of this.getPersistableLayoutNodes()) {
            const data = this.serializeLayoutNode(node);
            tx.insert(schema.tabGroups)
              .values({
                groupId: data.id,
                mode: data.mode,
                profileId: data.profileId,
                spaceId: data.spaceId,
                tabUniqueIds: data.tabUniqueIds,
                glanceFrontTabUniqueId: data.frontTabUniqueId ?? null,
                position: data.position
              })
              .run();
          }
        }
      });
    } catch (err) {
      // Re-queue entries that haven't been superseded by newer mutations
      for (const [uniqueId, data] of dirtySnapshot) {
        if (!this.dirtyTabs.has(uniqueId)) {
          this.dirtyTabs.set(uniqueId, data);
        }
      }
      for (const uniqueId of removedSnapshot) {
        if (!this.removedTabs.has(uniqueId) && !this.dirtyTabs.has(uniqueId)) {
          this.removedTabs.add(uniqueId);
        }
      }
      for (const [windowGroupId, state] of windowSnapshot) {
        if (!this.dirtyWindowStates.has(windowGroupId)) {
          this.dirtyWindowStates.set(windowGroupId, state);
        }
      }
      if (layoutNodesDirtySnapshot) {
        this.layoutNodesDirty = true;
      }
      throw err;
    }
  }

  // --- Load ---

  public loadAllTabs(): PersistedTabData[] {
    const db = getDb();
    const rows = db.select().from(schema.tabs).all();
    return rows.map((row) => this.rowToPersistedData(row));
  }

  public loadAllLayoutNodes(): PersistedTabLayoutNodeData[] {
    const db = getDb();
    const rows = db.select().from(schema.tabGroups).all();
    return rows.map((row) => ({
      id: row.groupId,
      mode: row.mode as Exclude<import("~/types/tab-service").TabLayoutNodeMode, "single">,
      tabUniqueIds: row.tabUniqueIds,
      frontTabUniqueId: row.glanceFrontTabUniqueId ?? undefined,
      position: row.position,
      spaceId: row.spaceId,
      profileId: row.profileId
    }));
  }

  public loadAllWindowStates(): Map<string, PersistedWindowState> {
    const db = getDb();
    const rows = db.select().from(schema.windowStates).all();
    const result = new Map<string, PersistedWindowState>();
    for (const row of rows) {
      result.set(row.windowGroupId, {
        width: row.width,
        height: row.height,
        x: row.x ?? undefined,
        y: row.y ?? undefined,
        isPopup: row.isPopup ?? undefined
      });
    }
    return result;
  }

  // --- Remove ---

  public removeTab(uniqueId: string): void {
    const db = getDb();
    db.delete(schema.tabs).where(eq(schema.tabs.uniqueId, uniqueId)).run();
  }

  public removeLayoutNode(nodeId: string): void {
    const db = getDb();
    db.delete(schema.tabGroups).where(eq(schema.tabGroups.groupId, nodeId)).run();
  }

  // --- Serialization ---

  public serializeTab(tab: Tab): PersistedTabData {
    const url = tab.url;
    const rawNavHistory = tab.navHistory;
    const rawNavHistoryIndex = tab.navHistoryIndex;

    const { navHistory, navHistoryIndex } = stripSleepEntries(rawNavHistory, rawNavHistoryIndex);

    return {
      schemaVersion: TAB_SERVICE_SCHEMA_VERSION,
      uniqueId: tab.uniqueId,
      createdAt: tab.createdAt,
      lastActiveAt: tab.lastActiveAt,
      position: tab.position,
      profileId: tab.profileId,
      spaceId: tab.spaceId,
      windowGroupId: `w-${tab.getWindow().id}`,
      title: tab.title,
      url,
      faviconURL: tab.faviconURL,
      muted: tab.muted,
      navHistory,
      navHistoryIndex,
      owner: tab.owner
    };
  }

  public serializeLayoutNode(node: TabLayoutNode): PersistedTabLayoutNodeData {
    const tabUniqueIds: string[] = [];
    for (const tab of node.tabs) {
      tabUniqueIds.push(tab.uniqueId);
    }

    return {
      id: node.id,
      mode: node.mode as Exclude<import("~/types/tab-service").TabLayoutNodeMode, "single">,
      tabUniqueIds,
      frontTabUniqueId: node.frontTab?.uniqueId,
      position: node.position,
      spaceId: node.spaceId,
      profileId: node.profileId
    };
  }

  // --- Private ---

  private getPersistableLayoutNodes(): TabLayoutNode[] {
    const nodes = new Map<string, TabLayoutNode>();
    for (const layout of this.tabService.layouts.values()) {
      for (const node of layout.getNodes()) {
        if (node.mode === "single") continue;
        if (node.isDestroyed || node.tabCount < 2) continue;
        if (!node.tabs.every((tab) => tab.owner.kind === "normal")) continue;
        nodes.set(node.id, node);
      }
    }
    return [...nodes.values()];
  }

  private persistedDataToInsert(data: PersistedTabData) {
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

  private rowToPersistedData(row: {
    uniqueId: string;
    schemaVersion: number;
    createdAt: number;
    lastActiveAt: number;
    position: number;
    profileId: string;
    spaceId: string;
    windowGroupId: string;
    title: string;
    url: string;
    faviconUrl: string | null;
    muted: boolean;
    navHistory: NavigationEntry[];
    navHistoryIndex: number;
  }): PersistedTabData {
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
      navHistoryIndex: row.navHistoryIndex,
      owner: { kind: "normal" }
    };
  }
}
