export type NavigationEntry = {
  title: string;
  url: string;
};

export type TabNavigationStatus = {
  // Index 0: Represents the earliest visited page.
  // Index N: Represents the most recent page visited.
  navigationHistory: NavigationEntry[];
  activeIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
};

// API //
export interface FlowNavigationAPI {
  /**
   * Gets the navigation status of a tab
   * This can only be called from the Browser UI
   * @param tabId The id of the tab to get the navigation status of
   */
  getTabNavigationStatus: (tabId: number) => Promise<TabNavigationStatus | null>;

  /**
   * Stops loading a tab
   * This can only be called from the Browser UI
   * @param tabId The id of the tab to stop loading
   */
  stopLoadingTab: (tabId: number) => void;

  /**
   * Navigates to a specific navigation entry
   * This can only be called from the Browser UI
   * @param tabId The id of the tab to navigate to
   * @param index The index of the navigation entry to navigate to
   */
  goToNavigationEntry: (tabId: number, index: number) => void;
}
