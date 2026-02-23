import { IPCListener } from "~/flow/types";
import { RecentlyClosedTabData, WindowTabsData } from "~/types/tabs";

// API //
export interface FlowTabsAPI {
  /**
   * Get the data for all tabs
   * @returns The data for all tabs
   */
  getData: () => Promise<WindowTabsData>;

  /**
   * Add a callback to be called when the tabs data is updated
   * @param callback The callback to be called when the tabs data is updated
   */
  onDataUpdated: IPCListener<[WindowTabsData]>;

  /**
   * Switch to a tab
   * @param tabId The id of the tab to switch to
   */
  switchToTab: (tabId: number) => Promise<boolean>;

  /**
   * Create a new tab
   * @param url The url to load in the tab
   * @param isForeground Whether to make the tab the foreground tab
   * @param spaceId The id of the space to create the tab in
   */
  newTab: (url?: string, isForeground?: boolean, spaceId?: string) => Promise<boolean>;

  /**
   * Close a tab
   * @param tabId The id of the tab to close
   */
  closeTab: (tabId: number) => Promise<boolean>;

  /**
   * Show the context menu for a tab
   * @param tabId The id of the tab to show the context menu for
   */
  showContextMenu: (tabId: number) => void;

  /**
   * Disable Picture in Picture mode for a tab
   * @param goBackToTab Whether to go back to the tab after Picture in Picture mode is disabled
   */
  disablePictureInPicture: (goBackToTab: boolean) => Promise<boolean>;

  /**
   * Set the muted state of a tab
   * @param tabId The id of the tab to set muted state for
   * @param muted Whether the tab should be muted
   */
  setTabMuted: (tabId: number, muted: boolean) => Promise<boolean>;

  /**
   * Move a tab to a new position
   * @param tabId The id of the tab to move
   * @param newPosition The new position of the tab
   */
  moveTab: (tabId: number, newPosition: number) => Promise<boolean>;

  /**
   * Move a tab to a new space
   * @param tabId The id of the tab to move
   * @param spaceId The id of the space to move the tab to
   * @param newPosition The new position of the tab
   */
  moveTabToWindowSpace: (tabId: number, spaceId: string, newPosition?: number) => Promise<boolean>;

  /**
   * Move multiple tabs to a new space in one operation
   * @param tabIds The ids of the tabs to move
   * @param spaceId The target space id
   * @param newPositionStart The starting position for the moved tabs
   */
  batchMoveTabs: (tabIds: number[], spaceId: string, newPositionStart?: number) => Promise<boolean>;

  /**
   * Get all recently closed tabs
   * @returns Array of recently closed tab data, sorted by most recently closed first
   */
  getRecentlyClosed: () => Promise<RecentlyClosedTabData[]>;

  /**
   * Restore a recently closed tab by its unique ID
   * @param uniqueId The unique ID of the tab to restore
   * @returns Whether the tab was successfully restored
   */
  restoreRecentlyClosed: (uniqueId: string) => Promise<boolean>;

  /**
   * Clear all recently closed tabs
   * @returns Whether the operation was successful
   */
  clearRecentlyClosed: () => Promise<boolean>;
}
