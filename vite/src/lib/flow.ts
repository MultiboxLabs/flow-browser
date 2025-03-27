export type PageBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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

type QueryParams = { [key: string]: string };

/**
 * Interface for the Flow API exposed by the Electron preload script
 */
interface FlowInterfaceAPI {
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

  /**
   * Navigates to a specific navigation entry
   * This can only be called from the Browser UI
   * @param tabId The id of the tab to navigate to
   * @param index The index of the navigation entry to navigate to
   */
  goToNavigationEntry: (tabId: number, index: number) => void;

  /**
   * Gets the platform of the current device
   */
  getPlatform: () => string;

  /**
   * Adds a callback to be called when the sidebar is toggled
   */
  onToggleSidebar: (callback: () => void) => () => void;
}

interface FlowOmniboxAPI {
  /**
   * Shows the omnibox
   */
  show: (bounds: PageBounds | null, params: QueryParams | null) => void;

  /**
   * Hides the omnibox
   */
  hide: () => void;
}

interface FlowSettingsAPI {
  getAppInfo: () => Promise<{
    app_version: string;
    build_number: string;
    node_version: string;
    chrome_version: string;
    electron_version: string;
    os: string;
    update_channel: "Stable" | "Beta" | "Alpha" | "Development";
  }>;
}

declare global {
  /**
   * The Flow API instance exposed by the Electron preload script
   * This is defined in electron/preload.ts and exposed via contextBridge
   */
  const flow: {
    interface: FlowInterfaceAPI;
    omnibox: FlowOmniboxAPI;
    settings: FlowSettingsAPI;
  };
}

// Browser Interface API //
export function setPageBounds(bounds: PageBounds) {
  return flow.interface.setPageBounds(bounds);
}

export function setWindowButtonPosition(position: { x: number; y: number }) {
  return flow.interface.setWindowButtonPosition(position);
}

export function setWindowButtonVisibility(visible: boolean) {
  return flow.interface.setWindowButtonVisibility(visible);
}

export function getTabNavigationStatus(tabId: number) {
  return flow.interface.getTabNavigationStatus(tabId);
}

export function stopLoadingTab(tabId: number) {
  return flow.interface.stopLoadingTab(tabId);
}

export function goToNavigationEntry(tabId: number, index: number) {
  return flow.interface.goToNavigationEntry(tabId, index);
}

export function getPlatform() {
  return flow.interface.getPlatform();
}

export function onToggleSidebar(callback: () => void) {
  return flow.interface.onToggleSidebar(callback);
}

// Omnibox API //
export function showOmnibox(bounds: PageBounds | null, params: QueryParams | null) {
  return flow.omnibox.show(bounds, params);
}

export function hideOmnibox() {
  return flow.omnibox.hide();
}

// Settings API //
export function getAppInfo() {
  return flow.settings.getAppInfo();
}
