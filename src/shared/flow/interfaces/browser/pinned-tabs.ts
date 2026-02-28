import { IPCListener } from "~/flow/types";
import { PinnedTabData } from "~/types/pinned-tabs";

// API //
export interface FlowPinnedTabsAPI {
  /**
   * Get all pinned tabs grouped by profile ID.
   * @returns A record mapping profile IDs to arrays of pinned tab data
   */
  getData: () => Promise<Record<string, PinnedTabData[]>>;

  /**
   * Listen for changes to pinned tabs data.
   * @param callback Receives all pinned tabs grouped by profile ID
   */
  onChanged: IPCListener<[Record<string, PinnedTabData[]>]>;

  /**
   * Create a pinned tab from an existing browser tab.
   * The tab's current URL becomes the pinned tab's defaultUrl.
   * @param tabId The ID of the browser tab to pin
   */
  createFromTab: (tabId: number) => Promise<PinnedTabData | null>;

  /**
   * Click handler: activate or create the associated browser tab.
   * @param pinnedTabId The unique ID of the pinned tab
   */
  click: (pinnedTabId: string) => Promise<boolean>;

  /**
   * Double-click handler: navigate associated tab back to defaultUrl.
   * @param pinnedTabId The unique ID of the pinned tab
   */
  doubleClick: (pinnedTabId: string) => Promise<boolean>;

  /**
   * Remove a pinned tab.
   * @param pinnedTabId The unique ID of the pinned tab to remove
   */
  remove: (pinnedTabId: string) => Promise<boolean>;

  /**
   * Unpin a tab back to the tab list.
   * Removes the pinned tab and makes the associated browser tab persistent
   * so it reappears in the sidebar.
   * @param pinnedTabId The unique ID of the pinned tab to unpin
   */
  unpinToTabList: (pinnedTabId: string) => Promise<boolean>;

  /**
   * Reorder a pinned tab to a new position.
   * @param pinnedTabId The unique ID of the pinned tab
   * @param newPosition The new position index
   */
  reorder: (pinnedTabId: string, newPosition: number) => Promise<boolean>;

  /**
   * Show the context menu for a pinned tab.
   * @param pinnedTabId The unique ID of the pinned tab
   */
  showContextMenu: (pinnedTabId: string) => void;
}
