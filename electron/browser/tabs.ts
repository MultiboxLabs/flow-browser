import { Browser } from "@/browser/browser";
import { Tab } from "@/browser/tab";
import { PageBoundsWithWindow } from "@/ipc/browser/page";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getLastUsedSpaceFromProfile } from "@/sessions/spaces";
import { Session } from "electron";
import { ElectronChromeExtensions } from "electron-chrome-extensions";

enum TabMode {
  Standard = "standard",
  // TODO: Implement these modes in the future
  Glance = "glance",
  Split = "split"
}

type TabShowMode = TabMode;
type ActiveTabsMode = TabMode;

interface TabEvents {
  "tab-created": [Tab];
  "tab-destroyed": [Tab];
  "tab-selected": [Tab];
  "tab-deselected": [Tab];
  "tab-focused": [Tab];
  "tab-unfocused": [Tab];
  "tab-updated": [Tab];
}

interface TabActiveData {
  mode: ActiveTabsMode;
  tabs: Array<{
    tabId: number;
    show: TabShowMode;
  }>;
}

// Tab Manager
export class TabManager extends TypedEventEmitter<TabEvents> {
  // Private properties
  private readonly browser: Browser;
  private readonly profileId: string;
  private readonly session: Session;
  private readonly tabs: Map<number, Tab> = new Map();
  private extensions: ElectronChromeExtensions | null = null;
  private isDestroyed: boolean = false;

  // Tab state tracking
  activeTabsMode: ActiveTabsMode = TabMode.Standard;
  private activeTabsBySpace: Map<string, Map<number, TabShowMode>> = new Map();
  private focusedTabBySpace: Map<string, number | null> = new Map();

  /**
   * Creates a new tab manager
   */
  constructor(browser: Browser, profileId: string, session: Session) {
    super();

    this.browser = browser;
    this.profileId = profileId;
    this.session = session;
  }

  /**
   * Handles changes to page bounds
   */
  handlePageBoundsChanged(windowId: number): void {
    if (this.isDestroyed) return;

    // Update all active tabs in the affected window
    for (const activeTabsMap of this.activeTabsBySpace.values()) {
      for (const [tabId] of activeTabsMap.entries()) {
        const tab = this.tabs.get(tabId);
        if (tab && tab.windowId === windowId) {
          tab.updateLayout();
        }
      }
    }
  }

  /**
   * Sets the extensions manager for this tab manager
   */
  setExtensions(extensions: ElectronChromeExtensions): void {
    this.extensions = extensions;
  }

  /**
   * Gets a tab by ID
   */
  get(tabId: number): Tab | undefined {
    return this.tabs.get(tabId);
  }

  /**
   * Creates a new tab
   */
  async create(
    windowId: number,
    webContentsViewOptions: Electron.WebContentsViewConstructorOptions = {},
    spaceId?: string
  ): Promise<Tab> {
    if (this.isDestroyed) {
      throw new Error("TabManager has been destroyed");
    }

    // Get space ID if not provided
    if (!spaceId) {
      try {
        const lastUsedSpace = await getLastUsedSpaceFromProfile(this.profileId);
        spaceId = lastUsedSpace.id;
      } catch (error) {
        console.error("Failed to get last used space:", error);
        throw new Error("Could not determine space ID for new tab");
      }
    }

    // Get window
    const window = this.browser.getWindowById(windowId);
    if (!window) {
      throw new Error(`Window with ID ${windowId} not found`);
    }

    // Create and register tab
    try {
      const tab = new Tab({
        browser: this.browser,
        tabManager: this,
        window,
        spaceId,
        webContentsViewOptions
      });

      this.tabs.set(tab.id, tab);
      this.emit("tab-created", tab);

      return tab;
    } catch (error) {
      console.error("Failed to create tab:", error);
      throw new Error("Failed to create tab: " + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Removes a tab by ID
   */
  remove(tabId: number): boolean {
    if (this.isDestroyed) return false;

    const tab = this.tabs.get(tabId);
    if (!tab) return false;

    // Clean up tab state
    if (this.isTabActive(tabId)) {
      this.deselect(tabId);
    }

    // Remove tab and notify
    this.tabs.delete(tabId);
    return true;
  }

  /**
   * Sets the active tabs mode (standard, glance, split)
   */
  setActiveTabsMode(mode: ActiveTabsMode): void {
    if (this.isDestroyed) return;

    // If trying to set to an unsupported mode, use standard
    if (mode !== TabMode.Standard) {
      console.warn(`Tab mode ${mode} is not implemented yet. Using standard mode instead.`);
      mode = TabMode.Standard;
    }

    this.activeTabsMode = mode;

    // Re-layout all active tabs according to new mode
    for (const activeTabsMap of this.activeTabsBySpace.values()) {
      for (const [tabId, showMode] of activeTabsMap.entries()) {
        const tab = this.tabs.get(tabId);
        if (tab) {
          tab.updateLayout();
        }
      }
    }
  }

  /**
   * Get active tabs map for a specific space
   */
  private getActiveTabsForSpace(spaceId: string): Map<number, TabShowMode> {
    if (!this.activeTabsBySpace.has(spaceId)) {
      this.activeTabsBySpace.set(spaceId, new Map());
    }
    return this.activeTabsBySpace.get(spaceId)!;
  }

  /**
   * Checks if a tab is currently active
   */
  isTabActive(tabId: number): boolean {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;

    const activeTabsForSpace = this.getActiveTabsForSpace(tab.spaceId);
    return activeTabsForSpace.has(tabId);
  }

  /**
   * Focuses a tab by ID
   */
  focus(tabId: number): boolean {
    if (this.isDestroyed) return false;

    const tab = this.tabs.get(tabId);
    if (!tab) {
      return false;
    }

    const currentFocusedTab = this.focusedTabBySpace.get(tab.spaceId);
    if (currentFocusedTab === tabId) {
      return true;
    }

    // Unfocus current tab if any
    if (currentFocusedTab) {
      this.unfocus(currentFocusedTab);
    }

    tab.focused = true;
    this.focusedTabBySpace.set(tab.spaceId, tabId);
    this.emit("tab-focused", tab);
    return true;
  }

  /**
   * Unfocuses a tab by ID
   */
  unfocus(tabId: number): boolean {
    if (this.isDestroyed) return false;

    const tab = this.tabs.get(tabId);
    if (!tab) {
      return false;
    }

    tab.focused = false;
    const currentFocusedTab = this.focusedTabBySpace.get(tab.spaceId);
    if (currentFocusedTab === tabId) {
      this.focusedTabBySpace.set(tab.spaceId, null);
    }
    this.emit("tab-unfocused", tab);
    return true;
  }

  /**
   * Selects a tab by ID
   */
  select(tabId: number): boolean {
    if (this.isDestroyed) return false;

    const tab = this.tabs.get(tabId);
    if (!tab) {
      return false;
    }

    const isActive = this.isTabActive(tabId);
    if (isActive) {
      return true;
    }

    // For now, always use standard mode
    this.handleStandardModeSelection(tab);
    this.emit("tab-selected", tab);
    return true;
  }

  /**
   * Handles selection in standard mode
   */
  private handleStandardModeSelection(tab: Tab): void {
    const activeTabsForSpace = this.getActiveTabsForSpace(tab.spaceId);

    // Hide all other tabs in the same space
    for (const [tabId, _showMode] of activeTabsForSpace.entries()) {
      if (tabId !== tab.id) {
        this.deselect(tabId);
      }
    }

    // Show the selected tab
    activeTabsForSpace.set(tab.id, TabMode.Standard);
    tab.show(TabMode.Standard);
    tab.updateLayout();

    this.focus(tab.id);
  }

  /**
   * Handles selection in glance mode
   * TODO: Implement Glance mode in the future
   */
  private handleGlanceModeSelection(tab: Tab): void {
    // For now, just use standard mode
    this.handleStandardModeSelection(tab);
  }

  /**
   * Handles selection in split mode
   * TODO: Implement Split mode in the future
   */
  private handleSplitModeSelection(tab: Tab): void {
    // For now, just use standard mode
    this.handleStandardModeSelection(tab);
  }

  /**
   * Updates the layout of tabs in split mode
   * TODO: Implement Split layout in the future
   */
  private updateSplitLayout(): void {
    // No-op for now - will be implemented in the future
  }

  /**
   * Deselects a tab by ID
   */
  deselect(tabId: number): boolean {
    if (this.isDestroyed) return false;

    const tab = this.tabs.get(tabId);
    if (!tab) {
      return false;
    }

    const activeTabsForSpace = this.getActiveTabsForSpace(tab.spaceId);
    if (!activeTabsForSpace.has(tabId)) {
      return false;
    }

    activeTabsForSpace.delete(tabId);
    tab.hide();

    const currentFocusedTab = this.focusedTabBySpace.get(tab.spaceId);
    if (currentFocusedTab === tabId) {
      this.unfocus(tabId);

      // Auto-focus another tab in the same space if available
      const nextActiveTab = Array.from(activeTabsForSpace.keys())[0];
      if (nextActiveTab) {
        this.focus(nextActiveTab);
      }
    }

    this.emit("tab-deselected", tab);
    return true;
  }

  /**
   * Gets active tabs data
   */
  getActiveData(): TabActiveData {
    // Combine all active tabs from all spaces
    const allActiveTabs: Array<{ tabId: number; show: TabShowMode }> = [];
    for (const activeTabsMap of this.activeTabsBySpace.values()) {
      allActiveTabs.push(
        ...Array.from(activeTabsMap.entries()).map(([tabId, show]) => ({
          tabId,
          show
        }))
      );
    }

    return {
      mode: this.activeTabsMode,
      tabs: allActiveTabs
    };
  }

  /**
   * Gets all tabs
   */
  getTabs(): Tab[] {
    return Array.from(this.tabs.values());
  }

  /**
   * Gets IDs of all active tabs
   */
  getActiveTabIds(): number[] {
    // Combine all active tab IDs from all spaces
    const allActiveTabIds: number[] = [];
    for (const activeTabsMap of this.activeTabsBySpace.values()) {
      allActiveTabIds.push(...activeTabsMap.keys());
    }
    return allActiveTabIds;
  }

  /**
   * Gets IDs of active tabs for a specific space
   */
  getActiveTabIdsForSpace(spaceId: string): number[] {
    const activeTabsForSpace = this.activeTabsBySpace.get(spaceId);
    return activeTabsForSpace ? Array.from(activeTabsForSpace.keys()) : [];
  }

  /**
   * Gets the focused tab ID for a specific space
   */
  getFocusedTabForSpace(spaceId: string): number | null {
    return this.focusedTabBySpace.get(spaceId) || null;
  }

  /**
   * Destroys the tab manager and all tabs
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.destroyEmitter();

    // Destroy all tabs
    for (const tab of this.tabs.values()) {
      try {
        tab.destroy();
      } catch (error) {
        console.error("Error destroying tab:", error);
      }
    }

    this.tabs.clear();
    this.activeTabsBySpace.clear();
    this.focusedTabBySpace.clear();
    this.extensions = null;
  }

  setCurrentWindowSpace(windowId: number, spaceId: string): void {
    // For each space, show/hide tabs based on whether they match the current space
    for (const [currentSpaceId, activeTabsMap] of this.activeTabsBySpace.entries()) {
      for (const [tabId, showMode] of activeTabsMap.entries()) {
        const tab = this.tabs.get(tabId);
        if (tab && tab.windowId === windowId) {
          if (tab.spaceId === spaceId) {
            tab.show(showMode);
          } else {
            tab.hide();
          }
        }
      }
    }
  }
}
