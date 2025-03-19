export type PageBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TabNavigationStatus = {
  canGoBack: boolean;
  canGoForward: boolean;
};

/**
 * Interface for the Flow API exposed by the Electron preload script
 */
interface FlowAPI {
  /**
   * Sets the bounds of the page content
   * Similar to setTabBounds but specifically for the page content area
   * This can only be called from the Browser UI
   * @param bounds The bounds object containing position and dimensions
   */
  setPageBounds: (bounds: PageBounds) => void;

  /**
   * Sets the position of the window button
   * This can only be called from the Browser UI
   * @param position The position object containing x and y coordinates
   */
  setWindowButtonPosition: (position: { x: number; y: number }) => void;

  /**
   * Sets the visibility of the window button
   * This can only be called from the Browser UI
   * @param visible Whether the window button should be visible
   */
  setWindowButtonVisibility: (visible: boolean) => void;

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
}

declare global {
  /**
   * The Flow API instance exposed by the Electron preload script
   * This is defined in electron/preload.ts and exposed via contextBridge
   */
  const flow: FlowAPI;
}

export function setPageBounds(bounds: PageBounds) {
  return flow.setPageBounds(bounds);
}

export function setWindowButtonPosition(position: { x: number; y: number }) {
  return flow.setWindowButtonPosition(position);
}

export function setWindowButtonVisibility(visible: boolean) {
  return flow.setWindowButtonVisibility(visible);
}

export function getTabNavigationStatus(tabId: number) {
  return flow.getTabNavigationStatus(tabId);
}

export function stopLoadingTab(tabId: number) {
  return flow.stopLoadingTab(tabId);
}
