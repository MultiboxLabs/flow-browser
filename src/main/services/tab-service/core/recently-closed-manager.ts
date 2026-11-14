import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { RecentlyClosedTabData, PersistedTabData, PersistedTabLayoutNodeData } from "~/types/tab-service";

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

  add(tabData: PersistedTabData, layoutNodeData?: PersistedTabLayoutNodeData): void {
    const closedAt = Date.now();
    this.entries = this.entries.filter((entry) => entry.tabData.uniqueId !== tabData.uniqueId);
    this.entries.unshift({ closedAt, tabData, layoutNodeData });
    this.entries.length = Math.min(this.entries.length, MAX_RECENTLY_CLOSED);
    this.emit("changed");
  }

  getAll(): RecentlyClosedTabData[] {
    return [...this.entries];
  }

  hasEntries(): boolean {
    return this.entries.length > 0;
  }

  peekMostRecent(): RecentlyClosedTabData | null {
    return this.entries[0] ?? null;
  }

  restore(uniqueId: string): { tabData: PersistedTabData; layoutNodeData?: PersistedTabLayoutNodeData } | null {
    const index = this.entries.findIndex((entry) => entry.tabData.uniqueId === uniqueId);
    if (index === -1) return null;

    const [row] = this.entries.splice(index, 1);
    this.emit("changed");
    return { tabData: row.tabData, layoutNodeData: row.layoutNodeData };
  }

  clear(): void {
    if (this.entries.length === 0) return;
    this.entries = [];
    this.emit("changed");
  }
}
