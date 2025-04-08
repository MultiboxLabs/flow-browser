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
  "page-bounds-changed": [PageBoundsWithWindow];
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
  private readonly pageBounds: Map<number, PageBoundsWithWindow> = new Map();

  // Tab state tracking
  activeTabsMode: ActiveTabsMode = TabMode.Standard;
  private readonly activeTabs: Map<number, TabShowMode> = new Map();
  focusedTabId: number | null = null;

  /**
   * Creates a new tab manager
   */
  constructor(browser: Browser, profileId: string, session: Session) {
    super();

    this.browser = browser;
    this.profileId = profileId;
    this.session = session;

    // Listen for page-bounds-changed events
    this.on("page-bounds-changed", this.handlePageBoundsChanged.bind(this));
  }

  /**
   * Handles changes to page bounds
   */
  private handlePageBoundsChanged(bounds: PageBoundsWithWindow): void {
    if (this.isDestroyed) return;

    // Update the bounds for the specific window
    const windowId = bounds.windowId;
    if (windowId !== undefined) {
      this.pageBounds.set(windowId, bounds);

      // Update all active tabs in the affected window
      for (const [tabId] of this.activeTabs.entries()) {
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
      const tab = new Tab(
        {
          parentWindow: window.window,
          spaceId,
          webContentsViewOptions
        },
        this
      );

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
    for (const [tabId, showMode] of this.activeTabs.entries()) {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.updateLayout();
      }
    }
  }

  /**
   * Checks if a tab is currently active
   */
  isTabActive(tabId: number): boolean {
    return this.activeTabs.has(tabId);
  }

  /**
   * Focuses a tab by ID
   */
  focus(tabId: number): boolean {
    if (this.isDestroyed) return false;

    if (this.focusedTabId === tabId) {
      return true;
    }

    // Unfocus current tab if any
    if (this.focusedTabId) {
      this.unfocus(this.focusedTabId);
    }

    const tab = this.tabs.get(tabId);
    if (!tab) {
      return false;
    }

    tab.focused = true;
    this.focusedTabId = tabId;
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
    this.focusedTabId = null;
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
    // Hide all other tabs
    for (const [tabId, _showMode] of this.activeTabs.entries()) {
      if (tabId !== tab.id) {
        this.deselect(tabId);
      }
    }

    // Show the selected tab
    this.activeTabs.set(tab.id, TabMode.Standard);
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

    const isActive = this.isTabActive(tabId);
    if (!isActive) {
      return false;
    }

    this.activeTabs.delete(tabId);
    tab.hide();

    if (this.focusedTabId === tabId) {
      this.unfocus(tabId);

      // Auto-focus another tab if available
      const nextActiveTab = Array.from(this.activeTabs.keys())[0];
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
    return {
      mode: this.activeTabsMode,
      tabs: Array.from(this.activeTabs.entries()).map(([tabId, show]) => ({
        tabId,
        show
      }))
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
    return Array.from(this.activeTabs.keys());
  }

  /**
   * Gets page bounds for a window
   */
  getPageBounds(windowId: number): PageBoundsWithWindow | undefined {
    return this.pageBounds.get(windowId);
  }

  /**
   * Sets page bounds for a window
   */
  setPageBounds(windowId: number, bounds: PageBoundsWithWindow): void {
    if (this.isDestroyed) return;

    this.pageBounds.set(windowId, bounds);
    // Create a new object that includes windowId
    const boundsWithWindow: PageBoundsWithWindow = { ...bounds };
    this.emit("page-bounds-changed", boundsWithWindow);
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
    this.activeTabs.clear();
    this.focusedTabId = null;
    this.extensions = null;
    this.pageBounds.clear();
  }
}
