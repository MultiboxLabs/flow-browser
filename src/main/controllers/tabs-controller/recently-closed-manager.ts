import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getCurrentTimestamp } from "@/modules/utils";
import { RecentlyClosedTabData, PersistedTabData, PersistedTabGroupData } from "~/types/tabs";

const MAX_RECENTLY_CLOSED = 10;

type RecentlyClosedEvents = {
  changed: [];
};

/**
 * Runtime-only store for recently closed tabs.
 * Closed tabs should never survive an app restart.
 */
export class RecentlyClosedManager extends TypedEventEmitter<RecentlyClosedEvents> {
  private entries: RecentlyClosedTabData[] = [];

  /**
   * Add a tab to the recently closed list.
   * Maintains a most-recent-first list capped at MAX_RECENTLY_CLOSED entries.
   */
  add(tabData: PersistedTabData, tabGroupData?: PersistedTabGroupData): void {
    const closedAt = getCurrentTimestamp();
    this.entries = this.entries.filter((entry) => entry.tabData.uniqueId !== tabData.uniqueId);
    this.entries.unshift({
      closedAt,
      tabData,
      tabGroupData
    });
    this.entries.length = Math.min(this.entries.length, MAX_RECENTLY_CLOSED);
    this.emit("changed");
  }

  /**
   * Get all recently closed tabs, sorted by most recently closed first.
   */
  getAll(): RecentlyClosedTabData[] {
    return [...this.entries];
  }

  public hasEntries(): boolean {
    return this.entries.length > 0;
  }

  public peekMostRecent(): RecentlyClosedTabData | null {
    return this.entries[0] ?? null;
  }

  /**
   * Restore a recently closed tab by uniqueId.
   * Removes it from the in-memory store and returns the persisted data along
   * with any tab group data the tab belonged to.
   */
  restore(uniqueId: string): { tabData: PersistedTabData; tabGroupData?: PersistedTabGroupData } | null {
    const index = this.entries.findIndex((entry) => entry.tabData.uniqueId === uniqueId);
    if (index === -1) return null;

    const [row] = this.entries.splice(index, 1);
    this.emit("changed");
    return {
      tabData: row.tabData,
      tabGroupData: row.tabGroupData
    };
  }

  public restoreMostRecent(): {
    tabData: PersistedTabData;
    tabGroupData?: PersistedTabGroupData;
  } | null {
    const mostRecent = this.peekMostRecent();
    if (!mostRecent) return null;
    return this.restore(mostRecent.tabData.uniqueId);
  }

  /**
   * Clear all recently closed tabs.
   */
  clear(): void {
    if (this.entries.length === 0) return;
    this.entries = [];
    this.emit("changed");
  }
}

export const recentlyClosedManager = new RecentlyClosedManager();
