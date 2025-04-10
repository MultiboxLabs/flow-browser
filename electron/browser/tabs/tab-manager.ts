import { Browser } from "@/browser/browser";
import { Tab } from "@/browser/tabs/tab";
import { BaseTabGroup, TabGroup, TabGroupMode } from "@/browser/tabs/tab-groups";
import { GlanceTabGroup } from "@/browser/tabs/tab-groups/glance";
import { SplitTabGroup } from "@/browser/tabs/tab-groups/split";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getLastUsedSpaceFromProfile } from "@/sessions/spaces";

type TabManagerEvents = {
  "tab-created": [Tab];
  "tab-changed": [Tab];
  "tab-removed": [Tab];
  "current-space-changed": [number, string];
  "active-tab-changed": [number, string];
  destroyed: [];
};

type WindowSpaceReference = `${number}-${string}`;

// Tab Class
export class TabManager extends TypedEventEmitter<TabManagerEvents> {
  // Public properties
  public tabs: Tab[];
  public isDestroyed: boolean = false;

  // Window Space Maps
  public windowActiveSpaceMap: Map<number, string> = new Map();
  public spaceActiveTabMap: Map<WindowSpaceReference, Tab | TabGroup> = new Map();
  public spaceFocusedTabMap: Map<WindowSpaceReference, Tab> = new Map();

  // Tab Groups
  public tabGroups: TabGroup[] = [];
  private tabGroupCounter: number = 0;

  // Private properties
  private readonly browser: Browser;

  /**
   * Creates a new tab manager instance
   */
  constructor(browser: Browser) {
    super();

    this.tabs = [];
    this.browser = browser;

    // Setup event listeners
    this.on("active-tab-changed", (windowId, spaceId) => {
      this.processActiveTabChange(windowId, spaceId);
    });

    this.on("current-space-changed", (windowId, spaceId) => {
      this.processActiveTabChange(windowId, spaceId);
    });
  }

  /**
   * Create a new tab
   */
  public async createTab(
    profileId: string,
    windowId: number,
    spaceId?: string,
    webContentsViewOptions?: Electron.WebContentsViewConstructorOptions
  ) {
    if (this.isDestroyed) {
      throw new Error("TabManager has been destroyed");
    }

    // Get space ID if not provided
    if (!spaceId) {
      try {
        const lastUsedSpace = await getLastUsedSpaceFromProfile(profileId);
        spaceId = lastUsedSpace.id;
      } catch (error) {
        console.error("Failed to get last used space:", error);
        throw new Error("Could not determine space ID for new tab");
      }
    }

    // Load profile if not already loaded
    const browser = this.browser;
    await browser.loadProfile(profileId);

    // Create tab
    return this.internalCreateTab(profileId, windowId, spaceId, webContentsViewOptions);
  }

  /**
   * Internal method to create a tab
   * Does not load profile or anything else!
   */
  public internalCreateTab(
    profileId: string,
    windowId: number,
    spaceId: string,
    webContentsViewOptions?: Electron.WebContentsViewConstructorOptions
  ) {
    if (this.isDestroyed) {
      throw new Error("TabManager has been destroyed");
    }

    // Get window
    const window = this.browser.getWindowById(windowId);
    if (!window) {
      // Should never happen
      throw new Error("Window not found");
    }

    // Get loaded profile
    const browser = this.browser;
    const profile = browser.getLoadedProfile(profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const profileSession = profile.session;

    // Create tab
    const tab = new Tab(
      {
        browser: this.browser,
        tabManager: this,
        profileId: profileId,
        spaceId: spaceId,
        session: profileSession
      },
      {
        window: window,
        webContentsViewOptions
      }
    );

    this.tabs.push(tab);

    // Setup event listeners
    tab.on("updated", () => {
      this.emit("tab-changed", tab);
    });
    tab.on("space-changed", () => {
      this.emit("tab-changed", tab);
    });
    tab.on("window-changed", () => {
      this.emit("tab-changed", tab);
    });
    tab.on("focused", () => {
      if (this.isTabActive(tab)) {
        this.setFocusedTab(tab);
      }
    });

    tab.on("destroyed", () => {
      this.removeTab(tab);
    });

    // Return tab
    this.emit("tab-created", tab);
    return tab;
  }

  /**
   * Process an active tab change
   */
  private processActiveTabChange(windowId: number, spaceId: string) {
    const tabs = this.getTabsInWindow(windowId);
    for (const tab of tabs) {
      if (tab.spaceId === spaceId) {
        const isActive = this.isTabActive(tab);
        if (isActive && !tab.visible) {
          tab.show();
        } else if (!isActive && tab.visible) {
          tab.hide();
        } else {
          tab.updateLayout();
        }
      } else {
        // Not in space
        tab.hide();
      }
    }
  }

  public isTabActive(tab: Tab) {
    const windowSpaceReference = `${tab.getWindow().id}-${tab.spaceId}` as WindowSpaceReference;
    const activeTab = this.spaceActiveTabMap.get(windowSpaceReference);

    if (activeTab instanceof Tab) {
      // Active Tab is a Tab
      if (tab.id === activeTab.id) {
        return true;
      }
    } else if (activeTab instanceof BaseTabGroup) {
      // Active Tab is a Tab Group
      if (activeTab.hasTab(tab.id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Set the active tab for a space
   */
  public setActiveTab(tab: Tab | TabGroup) {
    let windowId: number;
    let spaceId: string;

    if (tab instanceof Tab) {
      windowId = tab.getWindow().id;
      spaceId = tab.spaceId;
    } else {
      windowId = tab.windowId;
      spaceId = tab.spaceId;
    }

    const windowSpaceReference = `${windowId}-${spaceId}` as WindowSpaceReference;
    this.spaceActiveTabMap.set(windowSpaceReference, tab);

    if (tab instanceof Tab) {
      this.setFocusedTab(tab);
    } else {
      // Tab Group
      const frontTab = tab.tabs[0];
      if (frontTab) {
        this.setFocusedTab(frontTab);
      }
    }

    this.emit("active-tab-changed", windowId, spaceId);
  }

  /**
   * Get the active tab for a space
   */
  public getActiveTab(windowId: number, spaceId: string) {
    const windowSpaceReference = `${windowId}-${spaceId}` as WindowSpaceReference;
    return this.spaceActiveTabMap.get(windowSpaceReference);
  }

  /**
   * Remove the active tab for a space
   */
  public removeActiveTab(windowId: number, spaceId: string) {
    const windowSpaceReference = `${windowId}-${spaceId}` as WindowSpaceReference;
    this.spaceActiveTabMap.delete(windowSpaceReference);
    this.removeFocusedTab(windowId, spaceId);
    this.emit("active-tab-changed", windowId, spaceId);

    // Since there are no active tab, we use the first tab in the space
    const tabs = this.getTabsInWindowSpace(windowId, spaceId);
    if (tabs.length > 0) {
      const tab = tabs[0];
      this.setActiveTab(tab);
    }
  }

  /**
   * Set the focused tab for a space
   */
  private setFocusedTab(tab: Tab) {
    const windowSpaceReference = `${tab.getWindow().id}-${tab.spaceId}` as WindowSpaceReference;
    this.spaceFocusedTabMap.set(windowSpaceReference, tab);
  }

  /**
   * Remove the focused tab for a space
   */
  private removeFocusedTab(windowId: number, spaceId: string) {
    const windowSpaceReference = `${windowId}-${spaceId}` as WindowSpaceReference;
    this.spaceFocusedTabMap.delete(windowSpaceReference);
  }

  /**
   * Get the focused tab for a space
   */
  public getFocusedTab(windowId: number, spaceId: string) {
    const windowSpaceReference = `${windowId}-${spaceId}` as WindowSpaceReference;
    return this.spaceFocusedTabMap.get(windowSpaceReference);
  }

  /**
   * Remove a tab from the tab manager
   */
  public removeTab(tab: Tab) {
    this.tabs = this.tabs.filter((t) => t !== tab);
    this.emit("tab-removed", tab);
  }

  /**
   * Get a tab by id
   */
  public getTabById(tabId: number) {
    return this.tabs.find((tab) => tab.id === tabId);
  }

  /**
   * Get all tabs in a profile
   */
  public getTabsInProfile(profileId: string) {
    return this.tabs.filter((tab) => tab.profileId === profileId);
  }

  /**
   * Get all tabs in a space
   */
  public getTabsInSpace(spaceId: string) {
    return this.tabs.filter((tab) => tab.spaceId === spaceId);
  }

  /**
   * Get all tabs in a window space
   */
  public getTabsInWindowSpace(windowId: number, spaceId: string) {
    return this.tabs.filter((tab) => tab.getWindow().id === windowId && tab.spaceId === spaceId);
  }

  /**
   * Get all tabs in a window
   */
  public getTabsInWindow(windowId: number) {
    return this.tabs.filter((tab) => tab.getWindow().id === windowId);
  }

  /**
   * Set the current space for a window
   */
  public setCurrentWindowSpace(windowId: number, spaceId: string) {
    this.windowActiveSpaceMap.set(windowId, spaceId);
    this.emit("current-space-changed", windowId, spaceId);
  }

  /**
   * Handle page bounds changed
   */
  public handlePageBoundsChanged(windowId: number) {
    for (const tab of this.tabs) {
      const window = tab.getWindow();
      if (window && window.id === windowId) {
        tab.updateLayout();
      }
    }
  }

  /**
   * Get a tab group by tab id
   */
  public getTabGroupByTabId(tabId: number) {
    for (const tabGroup of this.tabGroups) {
      if (tabGroup.hasTab(tabId)) {
        return tabGroup;
      }
    }
    return null;
  }

  /**
   * Create a new tab group
   */
  public createTabGroup(mode: TabGroupMode, initialTabIds: [number, ...number[]]): TabGroup {
    const id = this.tabGroupCounter++;

    const initialTabs = initialTabIds
      .map((tabId) => {
        return this.getTabById(tabId);
      })
      .filter((tab) => tab !== undefined) as [Tab, ...Tab[]];

    const tabGroup = (() => {
      switch (mode) {
        case "glance":
          return new GlanceTabGroup(this.browser, this, id, initialTabs);
        case "split":
          return new SplitTabGroup(this.browser, this, id, initialTabs);
      }
    })();

    if (!tabGroup) {
      throw new Error("Invalid tab group mode");
    }

    tabGroup.on("destroy", () => {
      this.destroyTabGroup(id);
    });

    this.tabGroups.push(tabGroup);
    return tabGroup;
  }

  /**
   * Destroy a tab group
   */
  public destroyTabGroup(tabGroupId: number) {
    const tabGroup = this.tabGroups.find((tabGroup) => tabGroup.id === tabGroupId);
    if (!tabGroup) {
      throw new Error("Tab group not found");
    }

    if (!tabGroup.isDestroyed) {
      tabGroup.destroy();
    }

    this.tabGroups = this.tabGroups.filter((tabGroup) => tabGroup.id !== tabGroupId);

    if (this.getActiveTab(tabGroup.windowId, tabGroup.spaceId) === tabGroup) {
      this.removeActiveTab(tabGroup.windowId, tabGroup.spaceId);
    }
  }

  /**
   * Get a tab group by id
   */
  public getTabGroupById(tabGroupId: number) {
    return this.tabGroups.find((tabGroup) => tabGroup.id === tabGroupId);
  }

  /**
   * Destroy the tab manager
   */
  public destroy() {
    if (this.isDestroyed) {
      throw new Error("TabManager has already been destroyed");
    }

    this.isDestroyed = true;
    this.emit("destroyed");
    this.destroyEmitter();

    for (const tab of this.tabs) {
      tab.destroy();
    }
  }
}
