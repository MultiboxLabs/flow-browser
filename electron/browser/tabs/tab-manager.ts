import { Browser } from "@/browser/browser";
import { Tab } from "@/browser/tabs/tab";
import { BaseTabGroup, TabGroup } from "@/browser/tabs/tab-groups";
import { GlanceTabGroup } from "@/browser/tabs/tab-groups/glance";
import { SplitTabGroup } from "@/browser/tabs/tab-groups/split";
import { windowTabsChanged } from "@/ipc/browser/tabs";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getLastUsedSpace, getLastUsedSpaceFromProfile } from "@/sessions/spaces";
import { TabGroupMode } from "~/types/tabs";

export const NEW_TAB_URL = "flow://new-tab";

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
  public tabs: Map<number, Tab>;
  public isDestroyed: boolean = false;

  // Window Space Maps
  public windowActiveSpaceMap: Map<number, string> = new Map();
  public spaceActiveTabMap: Map<WindowSpaceReference, Tab | TabGroup> = new Map();
  public spaceFocusedTabMap: Map<WindowSpaceReference, Tab> = new Map();
  public spaceActivationHistory: Map<WindowSpaceReference, number[]> = new Map();

  // Tab Groups
  public tabGroups: Map<number, TabGroup>;
  private tabGroupCounter: number = 0;

  // Private properties
  private readonly browser: Browser;

  /**
   * Creates a new tab manager instance
   */
  constructor(browser: Browser) {
    super();

    this.tabs = new Map();
    this.tabGroups = new Map();
    this.browser = browser;

    // Setup event listeners
    this.on("active-tab-changed", (windowId, spaceId) => {
      this.processActiveTabChange(windowId, spaceId);
      windowTabsChanged(windowId);
    });

    this.on("current-space-changed", (windowId, spaceId) => {
      this.processActiveTabChange(windowId, spaceId);
      windowTabsChanged(windowId);
    });

    this.on("tab-created", (tab) => {
      windowTabsChanged(tab.getWindow().id);
    });

    this.on("tab-changed", (tab) => {
      windowTabsChanged(tab.getWindow().id);
    });

    this.on("tab-removed", (tab) => {
      windowTabsChanged(tab.getWindow().id);
    });
  }

  /**
   * Create a new tab
   */
  public async createTab(
    windowId: number,
    profileId?: string,
    spaceId?: string,
    webContentsViewOptions?: Electron.WebContentsViewConstructorOptions
  ) {
    if (this.isDestroyed) {
      throw new Error("TabManager has been destroyed");
    }

    // Get profile ID and space ID if not provided
    if (!profileId) {
      const lastUsedSpace = await getLastUsedSpace();
      if (lastUsedSpace) {
        profileId = lastUsedSpace.profileId;
        spaceId = lastUsedSpace.id;
      } else {
        throw new Error("Could not determine profile ID for new tab");
      }
    } else if (!spaceId) {
      try {
        const lastUsedSpace = await getLastUsedSpaceFromProfile(profileId);
        if (lastUsedSpace) {
          spaceId = lastUsedSpace.id;
        } else {
          throw new Error("Could not determine space ID for new tab");
        }
      } catch (error) {
        console.error("Failed to get last used space:", error);
        throw new Error("Could not determine space ID for new tab");
      }
    }

    // Load profile if not already loaded
    const browser = this.browser;
    await browser.loadProfile(profileId);

    // Create tab
    return this.internalCreateTab(windowId, profileId, spaceId, webContentsViewOptions);
  }

  /**
   * Internal method to create a tab
   * Does not load profile or anything else!
   */
  public internalCreateTab(
    windowId: number,
    profileId: string,
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

    this.tabs.set(tab.id, tab);

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
    const tabsInWindow = this.getTabsInWindow(windowId);
    for (const tab of tabsInWindow) {
      if (tab.spaceId === spaceId) {
        const isActive = this.isTabActive(tab);
        if (isActive && !tab.visible) {
          tab.show();
        } else if (!isActive && tab.visible) {
          tab.hide();
        } else {
          // Update layout even if visibility hasn't changed, e.g., for split view resizing
          tab.updateLayout();
        }
      } else {
        // Not in active space
        tab.hide();
      }
    }
  }

  public isTabActive(tab: Tab) {
    const windowSpaceReference = `${tab.getWindow().id}-${tab.spaceId}` as WindowSpaceReference;
    const activeTabOrGroup = this.spaceActiveTabMap.get(windowSpaceReference);

    if (!activeTabOrGroup) {
      return false;
    }

    if (activeTabOrGroup instanceof Tab) {
      // Active item is a Tab
      return tab.id === activeTabOrGroup.id;
    } else {
      // Active item is a Tab Group
      return activeTabOrGroup.hasTab(tab.id);
    }
  }

  /**
   * Set the active tab for a space
   */
  public setActiveTab(tabOrGroup: Tab | TabGroup) {
    let windowId: number;
    let spaceId: string;
    let tabToFocus: Tab | undefined;
    let idToStore: number;

    if (tabOrGroup instanceof Tab) {
      windowId = tabOrGroup.getWindow().id;
      spaceId = tabOrGroup.spaceId;
      tabToFocus = tabOrGroup;
      idToStore = tabOrGroup.id;
    } else {
      windowId = tabOrGroup.windowId;
      spaceId = tabOrGroup.spaceId;
      tabToFocus = tabOrGroup.tabs.length > 0 ? tabOrGroup.tabs[0] : undefined;
      idToStore = tabOrGroup.id;
    }

    const windowSpaceReference = `${windowId}-${spaceId}` as WindowSpaceReference;
    this.spaceActiveTabMap.set(windowSpaceReference, tabOrGroup);

    // Update activation history
    const history = this.spaceActivationHistory.get(windowSpaceReference) ?? [];
    const existingIndex = history.indexOf(idToStore);
    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }
    history.push(idToStore);
    this.spaceActivationHistory.set(windowSpaceReference, history);

    if (tabToFocus) {
      this.setFocusedTab(tabToFocus);
    } else {
      // If group has no tabs, remove focus
      this.removeFocusedTab(windowId, spaceId);
    }

    this.emit("active-tab-changed", windowId, spaceId);
  }

  /**
   * Get the active tab or group for a space
   */
  public getActiveTab(windowId: number, spaceId: string): Tab | TabGroup | undefined {
    const windowSpaceReference = `${windowId}-${spaceId}` as WindowSpaceReference;
    return this.spaceActiveTabMap.get(windowSpaceReference);
  }

  /**
   * Remove the active tab for a space and set a new one if possible
   */
  public removeActiveTab(windowId: number, spaceId: string) {
    const windowSpaceReference = `${windowId}-${spaceId}` as WindowSpaceReference;
    this.spaceActiveTabMap.delete(windowSpaceReference);
    this.removeFocusedTab(windowId, spaceId);

    // Try finding next active from history
    const history = this.spaceActivationHistory.get(windowSpaceReference);
    if (history) {
      // Iterate backwards through history (most recent first)
      for (let i = history.length - 1; i >= 0; i--) {
        const itemId = history[i];
        // Check if it's an existing Tab
        const tab = this.getTabById(itemId);
        if (tab && !tab.isDestroyed && tab.getWindow().id === windowId && tab.spaceId === spaceId) {
          // Ensure tab hasn't been moved out of the space since last activation check
          this.setActiveTab(tab);
          return; // Found replacement
        }
        // Check if it's an existing TabGroup
        const group = this.getTabGroupById(itemId);
        // Ensure group is not empty and belongs to the correct window/space
        if (
          group &&
          !group.isDestroyed &&
          group.tabs.length > 0 &&
          group.windowId === windowId &&
          group.spaceId === spaceId
        ) {
          this.setActiveTab(group);
          return; // Found replacement
        }
        // If item not found or invalid, it will be removed from history eventually
        // by removeTab/internalDestroyTabGroup, or we can clean it here (optional)
      }
    }

    // Find the next available tab or group in the same window/space to activate
    const tabsInSpace = this.getTabsInWindowSpace(windowId, spaceId);
    const groupsInSpace = this.getTabGroupsInWindow(windowId).filter(
      (group) => group.spaceId === spaceId && !group.isDestroyed && group.tabs.length > 0 // Ensure group valid
    );

    // Prioritize setting a non-empty group as active if available
    if (groupsInSpace.length > 0) {
      // Activate the first valid group found
      this.setActiveTab(groupsInSpace[0]);
    } else if (tabsInSpace.length > 0) {
      // If no group found or no groups exist, activate the first individual tab
      // Note: tabsInSpace already filters by window/space and existence in this.tabs
      this.setActiveTab(tabsInSpace[0]);
    } else {
      // No valid tabs or groups left, emit change without setting a new active tab
      this.emit("active-tab-changed", windowId, spaceId);
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
  public getFocusedTab(windowId: number, spaceId: string): Tab | undefined {
    const windowSpaceReference = `${windowId}-${spaceId}` as WindowSpaceReference;
    return this.spaceFocusedTabMap.get(windowSpaceReference);
  }

  /**
   * Remove a tab from the tab manager
   */
  public removeTab(tab: Tab) {
    const wasActive = this.isTabActive(tab);
    const windowId = tab.getWindow().id;
    const spaceId = tab.spaceId;
    const tabId = tab.id;

    if (!this.tabs.has(tabId)) return;

    this.tabs.delete(tabId);
    this.removeFromActivationHistory(tabId);
    this.emit("tab-removed", tab);

    if (wasActive) {
      // If the removed tab was part of the active element (tab or group)
      const activeElement = this.getActiveTab(windowId, spaceId);
      if (activeElement instanceof BaseTabGroup) {
        // If it was in an active group, the group handles its internal state.
        // We might still need to update focus if the removed tab was focused.
        if (this.getFocusedTab(windowId, spaceId)?.id === tab.id) {
          // If the removed tab was focused, focus the next tab in the group or remove focus
          const nextFocus = activeElement.tabs.find((t: Tab) => t.id !== tab.id);
          if (nextFocus) {
            this.setFocusedTab(nextFocus);
          } else {
            this.removeFocusedTab(windowId, spaceId);
            // If group becomes empty, remove it? Or handled by group itself? Assuming handled by group.
          }
        }
        // Check if group is now empty - group should emit destroy if so
        if (activeElement && activeElement.tabs.length === 0) {
          this.destroyTabGroup(activeElement.id); // Explicitly destroy if empty
        }
      } else {
        // If the active element was the tab itself, remove it and find the next active.
        this.removeActiveTab(windowId, spaceId);
      }
    } else {
      // Tab was not active, just ensure it's removed from any group it might be in
      const group = this.getTabGroupByTabId(tab.id);
      if (group) {
        group.removeTab(tab.id);
        if (group.tabs.length === 0) {
          this.destroyTabGroup(group.id); // Explicitly destroy if empty
        }
      }
    }
  }

  /**
   * Get a tab by id
   */
  public getTabById(tabId: number): Tab | undefined {
    return this.tabs.get(tabId);
  }

  /**
   * Get all tabs in a profile
   */
  public getTabsInProfile(profileId: string): Tab[] {
    const result: Tab[] = [];
    for (const tab of this.tabs.values()) {
      if (tab.profileId === profileId) {
        result.push(tab);
      }
    }
    return result;
  }

  /**
   * Get all tabs in a space
   */
  public getTabsInSpace(spaceId: string): Tab[] {
    const result: Tab[] = [];
    for (const tab of this.tabs.values()) {
      if (tab.spaceId === spaceId) {
        result.push(tab);
      }
    }
    return result;
  }

  /**
   * Get all tabs in a window space
   */
  public getTabsInWindowSpace(windowId: number, spaceId: string): Tab[] {
    const result: Tab[] = [];
    for (const tab of this.tabs.values()) {
      if (tab.getWindow().id === windowId && tab.spaceId === spaceId) {
        result.push(tab);
      }
    }
    return result;
  }

  /**
   * Get all tabs in a window
   */
  public getTabsInWindow(windowId: number): Tab[] {
    const result: Tab[] = [];
    for (const tab of this.tabs.values()) {
      if (tab.getWindow().id === windowId) {
        result.push(tab);
      }
    }
    return result;
  }

  /**
   * Get all tab groups in a window
   */
  public getTabGroupsInWindow(windowId: number): TabGroup[] {
    const result: TabGroup[] = [];
    for (const group of this.tabGroups.values()) {
      if (group.windowId === windowId) {
        result.push(group);
      }
    }
    return result;
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
    const tabsInWindow = this.getTabsInWindow(windowId);
    for (const tab of tabsInWindow) {
      tab.updateLayout();
    }
  }

  /**
   * Get a tab group by tab id
   */
  public getTabGroupByTabId(tabId: number): TabGroup | undefined {
    const tab = this.getTabById(tabId);
    if (tab && tab.groupId !== null) {
      return this.tabGroups.get(tab.groupId);
    }
    return undefined;
  }

  /**
   * Create a new tab group
   */
  public createTabGroup(mode: TabGroupMode, initialTabIds: [number, ...number[]]): TabGroup {
    const id = this.tabGroupCounter++;

    const initialTabs: Tab[] = [];
    for (const tabId of initialTabIds) {
      const tab = this.getTabById(tabId);
      if (tab) {
        // Remove tab from any existing group it might be in
        const existingGroup = this.getTabGroupByTabId(tabId);
        existingGroup?.removeTab(tabId);
        initialTabs.push(tab);
      }
    }

    if (initialTabs.length === 0) {
      throw new Error("Cannot create a tab group with no valid initial tabs.");
    }

    let tabGroup: TabGroup;
    switch (mode) {
      case "glance":
        tabGroup = new GlanceTabGroup(this.browser, this, id, initialTabs as [Tab, ...Tab[]]);
        break;
      case "split":
        tabGroup = new SplitTabGroup(this.browser, this, id, initialTabs as [Tab, ...Tab[]]);
        break;
      default:
        throw new Error(`Invalid tab group mode: ${mode}`);
    }

    tabGroup.on("destroy", () => {
      // Ensure cleanup happens even if destroyTabGroup isn't called externally
      if (this.tabGroups.has(id)) {
        this.internalDestroyTabGroup(tabGroup);
      }
    });

    this.tabGroups.set(id, tabGroup);

    // If any of the initial tabs were active, make the new group active.
    // Use the space/window of the first tab for the group.
    const firstTab = initialTabs[0];
    if (this.getActiveTab(firstTab.getWindow().id, firstTab.spaceId)?.id === firstTab.id) {
      this.setActiveTab(tabGroup);
    } else {
      // Ensure layout is updated for grouped tabs
      for (const t of tabGroup.tabs) {
        t.updateLayout();
      }
    }

    return tabGroup;
  }

  /**
   * Internal method to cleanup destroyed tab group state
   */
  private internalDestroyTabGroup(tabGroup: TabGroup) {
    const wasActive = this.getActiveTab(tabGroup.windowId, tabGroup.spaceId) === tabGroup;
    const groupId = tabGroup.id;

    if (!this.tabGroups.has(groupId)) return;

    this.tabGroups.delete(groupId);
    this.removeFromActivationHistory(groupId);

    if (wasActive) {
      this.removeActiveTab(tabGroup.windowId, tabGroup.spaceId);
    }
    // Group should handle destroying its own tabs or returning them to normal state.
  }

  /**
   * Destroy a tab group
   */
  public destroyTabGroup(tabGroupId: number) {
    const tabGroup = this.getTabGroupById(tabGroupId);
    if (!tabGroup) {
      console.warn(`Attempted to destroy non-existent tab group ID: ${tabGroupId}`);
      return; // Don't throw, just warn and exit
    }

    // Ensure group's destroy logic runs first
    if (!tabGroup.isDestroyed) {
      tabGroup.destroy(); // This should trigger the "destroy" event handled in createTabGroup
    }

    // Cleanup TabManager state (might be redundant if event handler runs, but safe)
    this.internalDestroyTabGroup(tabGroup);
  }

  /**
   * Get a tab group by id
   */
  public getTabGroupById(tabGroupId: number): TabGroup | undefined {
    return this.tabGroups.get(tabGroupId);
  }

  /**
   * Destroy the tab manager
   */
  public destroy() {
    if (this.isDestroyed) {
      // Avoid throwing error if already destroyed, just return.
      console.warn("TabManager destroy called multiple times.");
      return;
    }

    this.isDestroyed = true;
    this.emit("destroyed");
    this.destroyEmitter(); // Destroys internal event emitter listeners

    // Destroy groups first to handle tab transitions cleanly
    // Create a copy of IDs as destroying modifies the map
    const groupIds = Array.from(this.tabGroups.keys());
    for (const groupId of groupIds) {
      this.destroyTabGroup(groupId);
    }

    // Destroy remaining individual tabs
    // Create a copy of values as destroying modifies the map
    const tabsToDestroy = Array.from(this.tabs.values());
    for (const tab of tabsToDestroy) {
      // Check if tab still exists (might have been destroyed by group)
      if (this.tabs.has(tab.id) && !tab.isDestroyed) {
        tab.destroy(); // Tab destroy should trigger removeTab via 'destroyed' event
      }
    }

    // Clear maps
    this.tabs.clear();
    this.tabGroups.clear();
    this.windowActiveSpaceMap.clear();
    this.spaceActiveTabMap.clear();
    this.spaceFocusedTabMap.clear();
    this.spaceActivationHistory.clear();
  }

  /**
   * Helper method to remove an item ID from all activation history lists
   */
  private removeFromActivationHistory(itemId: number) {
    let changed = false;
    for (const [key, history] of this.spaceActivationHistory.entries()) {
      const initialLength = history.length;
      // Filter out the itemId
      const newHistory = history.filter((id) => id !== itemId);
      if (newHistory.length < initialLength) {
        if (newHistory.length === 0) {
          this.spaceActivationHistory.delete(key); // Remove entry if history is empty
        } else {
          this.spaceActivationHistory.set(key, newHistory); // Update with filtered history
        }
        changed = true; // Mark that a change occurred (optional)
      }
    }
    // Method doesn't need to return anything, just modifies the map
  }
}
