import { getDb, schema } from "@/saving/db";
import { generateID } from "@/modules/utils";
import { eq } from "drizzle-orm";
import { PersistedPinnedTabData, PinnedTabData } from "~/types/pinned-tabs";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";

type PinnedTabsControllerEvents = {
  changed: [];
};

/**
 * Manages persistence and runtime state of pinned tabs.
 *
 * Pinned tabs are persistent URL shortcuts tied to a profile.
 * They are stored in a separate `pinned_tabs` table and associated
 * with live browser tabs at runtime via an in-memory map.
 *
 * All database writes are immediate (pinned tabs change infrequently).
 */
class PinnedTabsController extends TypedEventEmitter<PinnedTabsControllerEvents> {
  /** In-memory cache of all pinned tabs, keyed by uniqueId */
  private pinnedTabs = new Map<string, PersistedPinnedTabData>();

  /** Runtime association: pinnedTabId → browser tab ID */
  private associations = new Map<string, number>();

  /** Reverse lookup: browser tab ID → pinnedTabId */
  private reverseAssociations = new Map<number, string>();

  // --- Initialization ---

  /**
   * Load all pinned tabs from the database into memory.
   * Should be called once during app startup.
   */
  loadAll(): void {
    const db = getDb();
    const rows = db.select().from(schema.pinnedTabs).all();
    this.pinnedTabs.clear();
    for (const row of rows) {
      const data: PersistedPinnedTabData = { ...row };
      this.pinnedTabs.set(data.uniqueId, data);
    }
  }

  // --- CRUD Operations ---

  /**
   * Create a new pinned tab.
   * @returns The created pinned tab data
   */
  create(profileId: string, defaultUrl: string, faviconUrl: string | null, position?: number): PersistedPinnedTabData {
    const uniqueId = generateID();

    let finalPosition: number;
    if (position !== undefined) {
      // Use the requested position (fractional is fine, normalizePositions will fix it)
      finalPosition = position;
    } else {
      // Place at the end
      let maxPosition = -1;
      for (const pt of this.pinnedTabs.values()) {
        if (pt.profileId === profileId && pt.position > maxPosition) {
          maxPosition = pt.position;
        }
      }
      finalPosition = maxPosition + 1;
    }

    const data: PersistedPinnedTabData = {
      uniqueId,
      profileId,
      defaultUrl,
      faviconUrl,
      position: finalPosition
    };

    // Persist + normalize in a single transaction
    const db = getDb();
    db.transaction((tx) => {
      tx.insert(schema.pinnedTabs)
        .values({ ...data })
        .run();
      this.normalizePositionsInTx(tx, profileId);
    });

    // Update in-memory cache
    this.pinnedTabs.set(uniqueId, data);

    this.emit("changed");

    return data;
  }

  /**
   * Remove a pinned tab.
   */
  remove(uniqueId: string): void {
    const data = this.pinnedTabs.get(uniqueId);
    if (!data) return;

    // Clear association
    this.dissociateTab(uniqueId);

    // Remove from database + normalize in a single transaction
    const db = getDb();
    db.transaction((tx) => {
      tx.delete(schema.pinnedTabs).where(eq(schema.pinnedTabs.uniqueId, uniqueId)).run();
      // Remove from memory before normalizing so it's excluded
      this.pinnedTabs.delete(uniqueId);
      this.normalizePositionsInTx(tx, data.profileId);
    });

    this.emit("changed");
  }

  /**
   * Update a pinned tab's position (for reordering).
   */
  reorder(uniqueId: string, newPosition: number): void {
    const data = this.pinnedTabs.get(uniqueId);
    if (!data) return;

    data.position = newPosition;

    // Persist + normalize in a single transaction
    const db = getDb();
    db.transaction((tx) => {
      tx.update(schema.pinnedTabs).set({ position: newPosition }).where(eq(schema.pinnedTabs.uniqueId, uniqueId)).run();
      this.normalizePositionsInTx(tx, data.profileId);
    });

    this.emit("changed");
  }

  /**
   * Update a pinned tab's favicon URL.
   */
  updateFavicon(uniqueId: string, faviconUrl: string | null): void {
    const data = this.pinnedTabs.get(uniqueId);
    if (!data) return;

    data.faviconUrl = faviconUrl;

    // Persist immediately
    const db = getDb();
    db.update(schema.pinnedTabs).set({ faviconUrl }).where(eq(schema.pinnedTabs.uniqueId, uniqueId)).run();

    this.emit("changed");
  }

  // --- Association Management ---

  /**
   * Associate a pinned tab with a live browser tab.
   */
  associateTab(pinnedId: string, tabId: number): void {
    // Clear any existing association for this pinned tab
    const oldTabId = this.associations.get(pinnedId);
    if (oldTabId !== undefined) {
      this.reverseAssociations.delete(oldTabId);
    }

    // Clear any existing association for this browser tab
    const oldPinnedId = this.reverseAssociations.get(tabId);
    if (oldPinnedId !== undefined) {
      this.associations.delete(oldPinnedId);
    }

    this.associations.set(pinnedId, tabId);
    this.reverseAssociations.set(tabId, pinnedId);
    this.emit("changed");
  }

  /**
   * Dissociate a pinned tab from its browser tab.
   */
  dissociateTab(pinnedId: string): void {
    const tabId = this.associations.get(pinnedId);
    if (tabId !== undefined) {
      this.reverseAssociations.delete(tabId);
      this.associations.delete(pinnedId);
      this.emit("changed");
    }
  }

  /**
   * Called when a browser tab is destroyed.
   * Clears any association pointing to that tab.
   */
  onBrowserTabDestroyed(tabId: number): void {
    const pinnedId = this.reverseAssociations.get(tabId);
    if (pinnedId !== undefined) {
      this.associations.delete(pinnedId);
      this.reverseAssociations.delete(tabId);
      this.emit("changed");
    }
  }

  // --- Query Methods ---

  /**
   * Get all pinned tabs for a profile, sorted by position.
   */
  getByProfile(profileId: string): PinnedTabData[] {
    const result: PinnedTabData[] = [];
    for (const data of this.pinnedTabs.values()) {
      if (data.profileId === profileId) {
        result.push({
          ...data,
          associatedTabId: this.associations.get(data.uniqueId) ?? null
        });
      }
    }
    result.sort((a, b) => a.position - b.position);
    return result;
  }

  /**
   * Get all pinned tabs grouped by profile ID.
   */
  getAllByProfile(): Record<string, PinnedTabData[]> {
    const result: Record<string, PinnedTabData[]> = {};
    for (const data of this.pinnedTabs.values()) {
      if (!result[data.profileId]) {
        result[data.profileId] = [];
      }
      result[data.profileId].push({
        ...data,
        associatedTabId: this.associations.get(data.uniqueId) ?? null
      });
    }
    // Sort each profile's pinned tabs by position
    for (const profileId of Object.keys(result)) {
      result[profileId].sort((a, b) => a.position - b.position);
    }
    return result;
  }

  /**
   * Get a single pinned tab by ID.
   */
  getById(uniqueId: string): PinnedTabData | null {
    const data = this.pinnedTabs.get(uniqueId);
    if (!data) return null;
    return {
      ...data,
      associatedTabId: this.associations.get(uniqueId) ?? null
    };
  }

  /**
   * Get the associated browser tab ID for a pinned tab.
   */
  getAssociatedTabId(pinnedId: string): number | null {
    return this.associations.get(pinnedId) ?? null;
  }

  /**
   * Get the pinned tab ID associated with a browser tab.
   */
  getPinnedIdByTabId(tabId: number): string | null {
    return this.reverseAssociations.get(tabId) ?? null;
  }

  /**
   * Get all associated browser tab IDs for pinned tabs belonging to a profile.
   */
  getAssociatedTabIdsForProfile(profileId: string): number[] {
    const result: number[] = [];
    for (const [pinnedId, tabId] of this.associations) {
      const pinnedTab = this.pinnedTabs.get(pinnedId);
      if (pinnedTab && pinnedTab.profileId === profileId) {
        result.push(tabId);
      }
    }
    return result;
  }

  // --- Internal helpers ---

  /**
   * Normalize positions for a profile's pinned tabs to be contiguous 0, 1, 2, ...
   * Accepts a transaction handle so callers can include normalization in an
   * atomic operation with the preceding write.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizePositionsInTx(tx: any, profileId: string): void {
    const tabs: PersistedPinnedTabData[] = [];
    for (const data of this.pinnedTabs.values()) {
      if (data.profileId === profileId) {
        tabs.push(data);
      }
    }
    tabs.sort((a, b) => a.position - b.position);

    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].position !== i) {
        tabs[i].position = i;
        tx.update(schema.pinnedTabs).set({ position: i }).where(eq(schema.pinnedTabs.uniqueId, tabs[i].uniqueId)).run();
      }
    }
  }
}

// Singleton instance
export const pinnedTabsController = new PinnedTabsController();
