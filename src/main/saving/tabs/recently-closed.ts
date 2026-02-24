import { getDatastore } from "@/saving/datastore";
import { RecentlyClosedTabData, PersistedTabData, PersistedTabGroupData } from "~/types/tabs";
import { getCurrentTimestamp } from "@/modules/utils";

const MAX_RECENTLY_CLOSED = 25;
const RecentlyClosedDataStore = getDatastore("recently-closed");

/**
 * Manages a capped list of recently closed tabs that can be restored.
 * Stored in a separate datastore from active tabs.
 */
export class RecentlyClosedManager {
  /**
   * Add a tab to the recently closed list.
   * Maintains a FIFO queue capped at MAX_RECENTLY_CLOSED entries.
   */
  async add(tabData: PersistedTabData, tabGroupData?: PersistedTabGroupData): Promise<void> {
    const entry: RecentlyClosedTabData = {
      closedAt: getCurrentTimestamp(),
      tabData,
      tabGroupData
    };

    const allData = await this.getAll();
    allData.unshift(entry);

    // Cap the list
    const capped = allData.slice(0, MAX_RECENTLY_CLOSED);

    // Write the full list
    const storeData: Record<string, RecentlyClosedTabData> = {};
    for (const item of capped) {
      storeData[item.tabData.uniqueId] = item;
    }

    // Wipe and rewrite (since we need to enforce ordering and cap)
    await RecentlyClosedDataStore.wipe();
    if (Object.keys(storeData).length > 0) {
      await RecentlyClosedDataStore.setMany(storeData);
    }
  }

  /**
   * Get all recently closed tabs, sorted by most recently closed first.
   */
  async getAll(): Promise<RecentlyClosedTabData[]> {
    const data = await RecentlyClosedDataStore.getFullData();
    const entries = Object.values(data) as RecentlyClosedTabData[];
    return entries.sort((a, b) => b.closedAt - a.closedAt);
  }

  /**
   * Restore a recently closed tab by uniqueId.
   * Removes it from the recently closed store and returns the persisted data
   * along with any tab group data the tab belonged to.
   */
  async restore(uniqueId: string): Promise<{ tabData: PersistedTabData; tabGroupData?: PersistedTabGroupData } | null> {
    const entry = await RecentlyClosedDataStore.get<RecentlyClosedTabData>(uniqueId);
    if (!entry) return null;

    await RecentlyClosedDataStore.remove(uniqueId);
    return { tabData: entry.tabData, tabGroupData: entry.tabGroupData };
  }

  /**
   * Clear all recently closed tabs.
   */
  async clear(): Promise<void> {
    await RecentlyClosedDataStore.wipe();
  }
}

export const recentlyClosedManager = new RecentlyClosedManager();
