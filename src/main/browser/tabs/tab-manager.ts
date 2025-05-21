import { Browser } from "@/browser/browser";
import { Tab, TabCreationOptions } from "@/browser/tabs/tab";
import { BaseTabGroup, TabGroup } from "@/browser/tabs/tab-groups";
import { GlanceTabGroup } from "@/browser/tabs/tab-groups/glance";
import { SplitTabGroup } from "@/browser/tabs/tab-groups/split";
import { windowTabsChanged } from "@/ipc/browser/tabs";
import { setWindowSpace } from "@/ipc/session/spaces";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { shouldArchiveTab, shouldSleepTab } from "@/saving/tabs";
import { getLastUsedSpace, getLastUsedSpaceFromProfile } from "@/sessions/spaces";
import { WebContents } from "electron";
import { TabGroupMode } from "~/types/tabs";

export const NEW_TAB_URL = "flow://new-tab";
const ARCHIVE_CHECK_INTERVAL_MS = 10 * 1000;

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

    // Archive tabs over their lifetime
    const interval = setInterval(() => {
      for (const tab of this.tabs.values()) {
        if (!tab.visible && shouldArchiveTab(tab.lastActiveAt)) {
          tab.destroy();
        }
        if (!tab.visible && !tab.asleep && shouldSleepTab(tab.lastActiveAt)) {
          tab.putToSleep();
        }
      }
    }, ARCHIVE_CHECK_INTERVAL_MS);

    this.on("destroyed", () => {
      clearInterval(interval);
    });
  }

  /**
   * Create a new tab
   */
  public async createTab(
    windowId?: number,
    profileId?: string,
    spaceId?: string,
    webContentsViewOptions?: Electron.WebContentsViewConstructorOptions,
    tabCreationOptions: Partial<TabCreationOptions> = {}
  ) {
    if (this.isDestroyed) {
      throw new Error("TabManager has been destroyed");
    }

    if (!windowId) {
      const focusedWindow = this.browser.getFocusedWindow();
      if (focusedWindow) {
        windowId = focusedWindow.id;
      } else {
        const windows = this.browser.getWindows();
        if (windows.length > 0) {
          windowId = windows[0].id;
        } else {
          throw new Error("Could not determine window ID for new tab");
        }
      }
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
    return this.internalCreateTab(windowId, profileId, spaceId, webContentsViewOptions, tabCreationOptions);
  }

  /**
   * Internal method to create a tab
   * Does not load profile or anything else!
   */
  public internalCreateTab(
    windowId: number,
    profileId: string,
    spaceId: string,
    webContentsViewOptions?: Electron.WebContentsViewConstructorOptions,
    tabCreationOptions: Partial<TabCreationOptions> = {}
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

    // Get or assign groupId
    let groupId = tabCreationOptions.groupId;
    let isNewGroupForThisTab = false;

    if (groupId === undefined) {
      // Create a new default group for this tab
      groupId = this.tabGroupCounter++;
      isNewGroupForThisTab = true;
      // The actual group instance will be created after the tab itself is created.
    }

    // Create tab
    const tab = new Tab(
      {
        browser: this.browser,
        tabManager: this,
        profileId: profileId,
        spaceId: spaceId,
        session: profileSession,
        loadedProfile: profile,
        groupId: groupId // Pass groupId to TabCreationDetails
      },
      {
        window: window,
        webContentsViewOptions,
        // Pass groupId in options as well, Tab constructor should handle precedence.
        // If tabCreationOptions already had a groupId, it's used, otherwise the new one.
        ...tabCreationOptions,
        groupId: groupId
      }
    );

    this.tabs.set(tab.id, tab);

    // If a new group was designated for this tab, create it now
    if (isNewGroupForThisTab) {
        const newGroup = new BaseTabGroup(this.browser, this, groupId, [tab]);
        this.tabGroups.set(groupId, newGroup);
        
        // Listen for the destruction of this single-tab group
        newGroup.on("destroy", () => {
            // When group.destroy() is called, it emits this.
            // internalDestroyTabGroup will handle tab reassignment if the tab still exists.
            // Pass newGroup.tabs (which might be empty if tab was moved/destroyed first)
            // or ideally, the tabs that *were* in it right before destroy.
            // BaseTabGroup.destroy() should probably make tabs available to this event.
            // For now, assume internalDestroyTabGroup will check tab's current group.
            if (this.tabGroups.has(newGroup.id)) {
                 // Pass the tabs that were in the group. BaseTabGroup.destroy() should make these available.
                 // For now, we pass an empty array, and internalDestroyTabGroup will have to rely on
                 // the fact that tabs always have a group ID. This part of tab reassignment on group destroy
                 // is critical and complex.
                 // A better approach: the 'destroy' event from BaseTabGroup should pass its list of tabs.
                 // Let's assume BaseTabGroup's destroy emitter will pass its tabs.
                 // For now, this is a placeholder for that logic.
                 // If BaseTabGroup.destroy clears its tabs before emitting, this won't work as expected for reassignment.
                 // The reassignment logic is primarily in internalDestroyTabGroup.
                this.internalDestroyTabGroup(newGroup, newGroup.tabs); // newGroup.tabs will be empty if group.destroy cleared it
            }
        });
    }

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
   * Disable Picture in Picture mode for a tab
   */
  public disablePictureInPicture(tabId: number, goBackToTab: boolean) {
    const tab = this.getTabById(tabId);
    if (tab && tab.isPictureInPicture) {
      tab.updateStateProperty("isPictureInPicture", false);

      if (goBackToTab) {
        // Set the space for the window
        const win = tab.getWindow();
        setWindowSpace(win, tab.spaceId);

        // Focus window
        win.window.focus();

        // Set active tab
        this.setActiveTab(tab);
      }

      return true;
    }
    return false;
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
    tab.webContents.focus(); // Ensure the tab's web contents is focused
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

    const currentGroup = this.getTabGroupByTabId(tabId);

    this.tabs.delete(tabId);
    this.removeFromActivationHistory(tabId);
    this.emit("tab-removed", tab);

    if (currentGroup) {
      currentGroup.removeTab(tabId); // BaseTabGroup.removeTab just removes from its list

      if (currentGroup.tabs.length === 0) {
        // If the group is now empty, destroy it.
        // destroyTabGroup will trigger the group's 'destroy' event,
        // which then calls internalDestroyTabGroup for cleanup.
        // No tabs should need reassignment from this group as it's empty.
        this.destroyTabGroup(currentGroup.id);
      }
    } else {
      // This implies an inconsistent state if getTabGroupByTabId correctly logs an error
      // when a tab's group doesn't exist.
      console.warn(`Tab ${tabId} was removed, but its group (ID: ${tab.groupId}) could not be found or was already processed.`);
    }

    if (wasActive) {
      // If the removed tab was active (either directly or as part of an active group),
      // determine the next active tab/group.
      this.removeActiveTab(windowId, spaceId);
    }
    // Focus management is implicitly handled by removeActiveTab if it results in a new active tab/group,
    // or by ensuring focus is cleared if no active elements remain.
  }

  /**
   * Get a tab by id
   */
  public getTabById(tabId: number): Tab | undefined {
    return this.tabs.get(tabId);
  }

  /**
   * Get a tab by webContents
   */
  public getTabByWebContents(webContents: WebContents): Tab | undefined {
    for (const tab of this.tabs.values()) {
      if (tab.webContents === webContents) {
        return tab;
      }
    }
    return undefined;
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
    if (tab) { // groupId is now non-nullable on Tab
      const group = this.tabGroups.get(tab.groupId);
      if (!group) {
        // This indicates an inconsistency, as a tab's groupId should always point to an existing group.
        console.error(`Tab ${tabId} (uniqueId: ${tab.uniqueId}) has groupId ${tab.groupId}, but no such group exists in tabGroups. This is a critical error.`);
        // As a recovery mechanism, we could try to create a new default group for this orphan tab.
        // For now, logging the error is important. Returning undefined might lead to further issues.
        // Consider throwing an error or implementing recovery.
      }
      return group;
    }
    return undefined;
  }

  /**
   * Create a new tab group
   */
  public createTabGroup(mode: TabGroupMode, initialTabIds: [number, ...number[]]): TabGroup {
    const id = this.tabGroupCounter++;

    const initialTabs: Tab[] = [];
    const oldGroupsToDestroyIfEmpty: Map<number, TabGroup> = new Map();

    for (const tabId of initialTabIds) {
      const tab = this.getTabById(tabId);
      if (tab) {
        const oldGroupId = tab.groupId; // Every tab has a group.
        const oldGroup = this.getTabGroupById(oldGroupId);

        if (oldGroup) {
          // Store it for potential destruction later, but don't destroy yet,
          // as the tab is still technically in it until reassigned by the new group.
          oldGroupsToDestroyIfEmpty.set(oldGroupId, oldGroup);
          // oldGroup.removeTab(tabId) will be effectively done when the new group adds the tab,
          // or if we explicitly call it, ensure it doesn't change tab.groupId prematurely.
          // For now, BaseTabGroup.addTab correctly sets the new groupId.
        }
        initialTabs.push(tab);
      }
    }

    if (initialTabs.length === 0) {
      throw new Error("Cannot create a tab group with no valid initial tabs.");
    }

    // The new TabGroup's constructor (via BaseTabGroup.addTab) will set tab.groupId for these initialTabs.
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
      // The 'destroy' event from BaseTabGroup should ideally pass the list of tabs
      // it contained at the moment of destruction.
      // Assuming tabGroup.tabs still holds them or the event provides them.
      if (this.tabGroups.has(id)) {
        // Pass the tabs that were in the group. These tabs will be reassigned to new default groups.
        this.internalDestroyTabGroup(tabGroup, tabGroup.tabs /* or event.tabs */);
      }
    });

    this.tabGroups.set(id, tabGroup);

    // Now, process the old groups. After tabs have been assigned to the new group,
    // check if any of the old groups became empty.
    oldGroupsToDestroyIfEmpty.forEach((oldGroup, oldGroupId) => {
      // Re-fetch the group to check its current tab count, as tabs were moved.
      const potentiallyEmptyOldGroup = this.getTabGroupById(oldGroupId);
      if (potentiallyEmptyOldGroup) {
        // Manually remove tabs from old group's list if not already handled by `addTab` logic implicitly
        // This is a bit tricky: `BaseTabGroup.addTab` sets `tab.groupId = this.id`.
        // We need to ensure the old group's list is also updated.
        // A simple way: iterate `initialTabIds` and call `oldGroup.removeTab(tabId)`
        initialTabIds.forEach(tabIdMoved => {
            if (potentiallyEmptyOldGroup.hasTab(tabIdMoved)) { // Check if this old group actually had the tab
                 // And if tab's current group is no longer this old group
                 const movedTab = this.getTabById(tabIdMoved);
                 if(movedTab && movedTab.groupId !== potentiallyEmptyOldGroup.id) {
                    potentiallyEmptyOldGroup.removeTab(tabIdMoved);
                 }
            }
        });

        if (potentiallyEmptyOldGroup.tabs.length === 0) {
          this.destroyTabGroup(potentiallyEmptyOldGroup.id);
        }
      }
    });
    
    // If any of the initial tabs were active, make the new group active.
    // Use the space/window of the first tab for the group.
    const firstTab = tabGroup.tabs[0]; // Use tabGroup.tabs as it's now populated
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
  private internalDestroyTabGroup(tabGroup: TabGroup, tabsThatWereInGroup: Tab[]) {
    const wasActive = this.getActiveTab(tabGroup.windowId, tabGroup.spaceId) === tabGroup;
    const groupId = tabGroup.id;

    if (!this.tabGroups.has(groupId)) {
        // Group might have already been processed (e.g. if destroy is called multiple times or via event + direct call)
        if (!tabGroup.isDestroyed) {
            // If group object itself isn't marked destroyed, something is off.
            console.warn(`internalDestroyTabGroup called for group ID ${groupId} not in tabGroups, but group object not marked destroyed.`);
        }
        // If tabs were passed, they might still need re-assignment if their group ID still points to this group.
        // This is a safety net.
        tabsThatWereInGroup.forEach(tab => {
            if (!tab.isDestroyed && tab.groupId === groupId) {
                console.warn(`Tab ${tab.id} still pointed to destroyed group ${groupId}. Reassigning.`);
                const newDefaultGroupId = this.tabGroupCounter++;
                tab.groupId = newDefaultGroupId;
                const newDefaultGroup = new BaseTabGroup(this.browser, this, newDefaultGroupId, [tab]);
                this.tabGroups.set(newDefaultGroupId, newDefaultGroup);
                newDefaultGroup.on("destroy", () => {
                    if (this.tabGroups.has(newDefaultGroupId)) {
                        this.internalDestroyTabGroup(newDefaultGroup, newDefaultGroup.tabs);
                    }
                });
                tab.updateLayout();
            }
        });
        return;
    }

    this.tabGroups.delete(groupId);
    this.removeFromActivationHistory(groupId);

    // Reassign tabs that were in the destroyed group to new default groups
    for (const tab of tabsThatWereInGroup) {
      if (tab.isDestroyed) continue; // Skip if tab was already destroyed during group destruction

      // Critical: Only reassign if the tab still believes it belongs to the group being destroyed.
      // It might have been moved to another group just before this group's destruction.
      if (tab.groupId === groupId) {
        const newDefaultGroupId = this.tabGroupCounter++;
        tab.groupId = newDefaultGroupId; // Update tab's groupId

        const newDefaultGroup = new BaseTabGroup(this.browser, this, newDefaultGroupId, [tab]);
        this.tabGroups.set(newDefaultGroupId, newDefaultGroup);
        
        newDefaultGroup.on("destroy", () => {
            // Listen for the destruction of this new default group
            if (this.tabGroups.has(newDefaultGroupId)) {
                this.internalDestroyTabGroup(newDefaultGroup, newDefaultGroup.tabs);
            }
        });
        tab.updateLayout(); // Update layout as its group context changed
      }
    }

    if (wasActive) {
      // removeActiveTab will try to find the next suitable tab/group to activate.
      // This could be one of meninas the new default groups if applicable.
      this.removeActiveTab(tabGroup.windowId, tabGroup.spaceId);
    }
  }

  /**
   * Destroy a tab group
   */
  public destroyTabGroup(tabGroupId: number) {
    const tabGroup = this.getTabGroupById(tabGroupId);
    if (!tabGroup) {
      console.warn(`Attempted to destroy non-existent tab group ID: ${tabGroupId}`);
      return;
    }

    // Important: BaseTabGroup.destroy() is responsible for:
    // 1. Setting its own `isDestroyed = true`.
    // 2. Emitting the "destroy" event.
    // The "destroy" event handler (configured in internalCreateTab for default groups,
    // or in createTabGroup for user-made groups) is what calls internalDestroyTabGroup
    // with the list of tabs that were in the group.

    if (!tabGroup.isDestroyed) {
      // This will trigger the "destroy" event, which in turn calls
      // internalDestroyTabGroup with the list of tabs that were in the group.
      // The list of tabs should be collected by BaseTabGroup *before* it clears its internal list.
      tabGroup.destroy(); 
    } else {
      // If group was already marked destroyed (e.g., by itself), but TabManager might need to sync.
      // This typically happens if destroyTabGroup is called *after* group.destroy() already ran.
      // We still call internalDestroyTabGroup to ensure TabManager's state is clean
      // and tabs are correctly reassigned if the event handler didn't run or complete.
      // We pass tabGroup.tabs, which might be empty if destroy() cleared it.
      // This relies on internalDestroyTabGroup's safety checks for tabs still pointing to this group.
      this.internalDestroyTabGroup(tabGroup, tabGroup.tabs);
    }
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
      }
    }
    // Method doesn't need to return anything, just modifies the map
  }
}
