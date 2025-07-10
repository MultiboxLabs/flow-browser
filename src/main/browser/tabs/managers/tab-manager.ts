import { Browser } from "@/browser/browser";
import { Tab, TabCreationDetails } from "@/browser/tabs/objects/tab";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { windowTabsChanged } from "@/ipc/browser/tabs";
import { WebContents } from "electron";

type TabManagerEvents = {
  "tab-created": [Tab];
  "tab-updated": [Tab];
  "tab-removed": [Tab];
  destroyed: [];
};

type TabCreationOptions = Omit<TabCreationDetails, "browser" | "window">;

export class TabManager extends TypedEventEmitter<TabManagerEvents> {
  public tabs: Map<string, Tab> = new Map();
  public isDestroyed: boolean = false;

  private readonly browser: Browser;

  constructor(browser: Browser) {
    super();
    this.browser = browser;

    // Setup event listeners for window tab changes
    this.on("tab-created", (tab) => {
      const window = tab.window.get();
      if (window) {
        windowTabsChanged(window.id);
      }
    });

    this.on("tab-updated", (tab) => {
      const window = tab.window.get();
      if (window) {
        windowTabsChanged(window.id);
      }
    });

    this.on("tab-removed", (tab) => {
      const window = tab.window.get();
      if (window) {
        windowTabsChanged(window.id);
      }
    });
  }

  /**
   * Create a tab
   */
  public createTab(windowId: number, profileId: string, options: TabCreationOptions): Tab {
    if (this.isDestroyed) {
      throw new Error("TabManager has been destroyed");
    }

    // Get window
    const window = this.browser.getWindowById(windowId);
    if (!window) {
      throw new Error("Window not found");
    }

    // Get loaded profile
    const loadedProfile = this.browser.getLoadedProfile(profileId);
    if (!loadedProfile) {
      throw new Error("Profile not found");
    }

    // Create tab
    const tab = new Tab({
      browser: this.browser,
      window,
      ...options
    });

    // Add to tabs map
    this.tabs.set(tab.id, tab);

    // Setup event listeners
    this.setupTabEventListeners(tab);

    // Emit tab created event
    this.emit("tab-created", tab);

    return tab;
  }

  /**
   * Setup event listeners for a tab
   */
  private setupTabEventListeners(tab: Tab): void {
    // Handle tab destruction
    tab.on("destroyed", () => {
      this._removeTab(tab);
    });

    // Handle tab updates
    tab.on("data-changed", () => {
      this.emit("tab-updated", tab);
    });
  }

  /**
   * Remove a tab from the tab manager
   * @internal Should not be used directly, use `tab.destroy()` instead
   */
  private _removeTab(tab: Tab): void {
    if (!this.tabs.has(tab.id)) {
      return;
    }

    // Remove from tabs map
    this.tabs.delete(tab.id);

    // Emit tab removed event
    this.emit("tab-removed", tab);
  }

  /**
   * Get a tab by ID
   */
  public getTabById(tabId: string): Tab | undefined {
    return this.tabs.get(tabId);
  }

  /**
   * Get a tab by webContents
   */
  public getTabByWebContents(webContents: WebContents): Tab | undefined {
    for (const tab of this.tabs.values()) {
      if (tab.webview.webContents === webContents) {
        return tab;
      }
    }
    return undefined;
  }

  /**
   * Get all tabs
   */
  public getAllTabs(): Tab[] {
    return Array.from(this.tabs.values());
  }

  /**
   * Get all tabs in a window
   */
  public getTabsInWindow(windowId: number): Tab[] {
    const result: Tab[] = [];
    for (const tab of this.tabs.values()) {
      const tabWindow = tab.window.get();
      if (tabWindow.id === windowId) {
        result.push(tab);
      }
    }
    return result;
  }

  /**
   * Get the count of tabs
   */
  public getTabCount(): number {
    return this.tabs.size;
  }

  /**
   * Check if a tab exists
   */
  public hasTab(tabId: string): boolean {
    return this.tabs.has(tabId);
  }

  /**
   * Destroy the tab manager
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.emit("destroyed");

    // Destroy all tabs
    const tabsToDestroy = Array.from(this.tabs.values());
    for (const tab of tabsToDestroy) {
      tab.destroy();
    }

    // Clear tabs map
    this.tabs.clear();

    this.destroyEmitter();
  }
}
