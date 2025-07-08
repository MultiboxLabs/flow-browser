import { Browser } from "@/browser/browser";
import { Tab } from "@/browser/tabs/tab";
import { TabGroup } from "@/browser/tabs/tab-group";

/**
 * Controller responsible for managing tabs within a tab group.
 * Handles adding/removing tabs, maintaining tab state, and cleaning up event listeners.
 */
export class TabGroupTabsController {
  /** Reference to the browser instance that owns this tab group */
  private readonly browser: Browser;

  /** Reference to the tab group this controller manages */
  private readonly tabGroup: TabGroup;

  /** Set of tab IDs that belong to this tab group. Uses Set for O(1) operations. */
  private readonly tabIds: Set<string>;

  /**
   * Map of tab ID to array of listener disconnector functions.
   * Used to clean up event listeners when tabs are removed.
   */
  private readonly tabListenersDisconnectors: Map<string, (() => void)[]> = new Map();

  /**
   * Creates a new TabGroupTabsController instance.
   * @param tabGroup - The tab group this controller will manage
   */
  constructor(tabGroup: TabGroup) {
    this.browser = tabGroup.creationDetails.browser;
    this.tabGroup = tabGroup;

    // Initialize empty set of tab IDs
    this.tabIds = new Set();

    // Setup event listeners for focused tab
    tabGroup.connect("tab-removed", () => {
      if (this.tabIds.size === 0) {
        // Destroy the tab group
        this.tabGroup.destroy();
      }
    });
  }

  /**
   * Adds a tab to this tab group.
   * Sets up event listeners and emits the "tab-added" event.
   * Respects the maximum number of tabs allowed in the group.
   *
   * @param tab - The tab to add to the group
   * @returns true if the tab was added successfully, false if it was already in the group or would exceed the maximum tab limit
   */
  public addTab(tab: Tab) {
    // Check if tab is already in this group
    const hasTab = this.tabIds.has(tab.id);
    if (hasTab) {
      return false;
    }

    // Check if adding this tab would exceed the maximum allowed tabs
    // -1 means no limit
    if (this.tabGroup.maxTabs !== -1 && this.tabIds.size >= this.tabGroup.maxTabs) {
      return false;
    }

    // Add tab ID to our set
    this.tabIds.add(tab.id);

    // Setup event listeners for tab lifecycle management
    const disconnectDestroyListener = tab.connect("destroyed", () => {
      this.removeTab(tab);
    });

    const disconnectFocusedListener = tab.connect("focused", () => {
      this.tabGroup.focusedTab.set(tab);
    });

    // Store the disconnector function for cleanup later
    this.tabListenersDisconnectors.set(tab.id, [disconnectDestroyListener, disconnectFocusedListener]);

    // Notify tab group that a new tab was added
    this.tabGroup.emit("tab-added", tab);
    return true;
  }

  /**
   * Removes a tab from this tab group.
   * Cleans up event listeners and emits the "tab-removed" event.
   *
   * @param tab - The tab to remove from the group
   * @returns true if the tab was removed successfully, false if it wasn't in the group
   */
  public removeTab(tab: Tab) {
    // Check if tab exists in this group
    const hasTab = this.tabIds.has(tab.id);
    if (!hasTab) {
      return false;
    }

    // Remove tab ID from our set
    this.tabIds.delete(tab.id);

    // Clean up event listeners to prevent memory leaks
    const disconnectors = this.tabListenersDisconnectors.get(tab.id);
    if (disconnectors) {
      disconnectors.forEach((disconnector) => {
        disconnector();
      });
    }
    this.tabListenersDisconnectors.delete(tab.id);

    // Notify tab group that a tab was removed
    this.tabGroup.emit("tab-removed", tab);
    return true;
  }

  /**
   * Gets all tabs that belong to this tab group.
   * Filters out any tabs that may have been destroyed but not properly cleaned up.
   *
   * @returns Array of Tab instances that are currently in this group
   */
  public get(): Tab[] {
    const tabOrchestrator = this.browser.tabs;

    // Convert Set to Array and map tab IDs to actual Tab instances
    const tabs = Array.from(this.tabIds).map((id) => {
      return tabOrchestrator.tabManager.getTabById(id);
    });

    // Filter out any undefined tabs (in case a tab was destroyed but not properly removed)
    return tabs.filter((tab) => tab !== undefined);
  }

  /**
   * Checks if a tab belongs to this tab group.
   * @param tabId - The ID of the tab to check
   * @returns true if the tab belongs to this group, false otherwise
   */
  public hasTab(tabId: string): boolean {
    return this.tabIds.has(tabId);
  }

  /**
   * Cleans up all event listeners for all tabs in this group.
   * Should be called when the tab group is being destroyed to prevent memory leaks.
   */
  public cleanupListeners() {
    // Disconnect all event listeners
    this.tabListenersDisconnectors.forEach((disconnectors) => {
      disconnectors.forEach((disconnector) => {
        disconnector();
      });
    });

    // Clear the disconnectors map
    this.tabListenersDisconnectors.clear();
  }
}
