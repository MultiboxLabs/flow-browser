import { IPCListener } from "@/lib/flow/types";
import { WindowTabsData } from "~/types/tabs";

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
   * Disable Picture in Picture mode for a tab
   */
  disablePictureInPicture: () => Promise<boolean>;
  
  /**
   * Toggle mute for a tab
   * @param tabId The id of the tab to toggle mute for
   */
  toggleMute: (tabId: number) => Promise<boolean>;
}
