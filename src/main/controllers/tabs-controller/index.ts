import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { Tab, TabCreationOptions } from "./tab";
import { BaseTabGroup, TabGroup } from "./tab-groups";
import { TabBoundsController } from "./bounds";
import { TabLayoutManager } from "./tab-layout";
import { TabLifecycleManager } from "./tab-lifecycle";
import { windowTabsChanged, windowTabContentChanged } from "@/ipc/browser/tabs";
import { shouldArchiveTab, shouldSleepTab, tabPersistenceManager } from "@/saving/tabs";
import { serializeTab, serializeTabGroup } from "@/saving/tabs/serialization";
import { recentlyClosedManager } from "@/saving/tabs/recently-closed";
import { GlanceTabGroup } from "./tab-groups/glance";
import { SplitTabGroup } from "./tab-groups/split";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { spacesController } from "@/controllers/spaces-controller";
import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { setWindowSpace } from "@/ipc/session/spaces";
import { WebContents } from "electron";
import { TabGroupMode } from "~/types/tabs";
import { FLAGS } from "@/modules/flags";
import { quitController } from "@/controllers/quit-controller";

export const NEW_TAB_URL = "flow://new-tab";
const ARCHIVE_CHECK_INTERVAL_MS = 10 * 1000;

type TabsControllerEvents = {
  "tab-created": [Tab];
  "tab-removed": [Tab];
  "current-space-changed": [number, string];
  "active-tab-changed": [number, string];
  destroyed: [];
};

type WindowSpaceReference = `${number}-${string}`;

/**
 * Per-tab managers that the controller owns.
 * Stored alongside each Tab so the controller can call lifecycle/layout methods.
 */
interface TabManagers {
  lifecycle: TabLifecycleManager;
  layout: TabLayoutManager;
  bounds: TabBoundsController;
}

class TabsController extends TypedEventEmitter<TabsControllerEvents> {
  // Public properties
  public tabs: Map<number, Tab>;

  // Per-tab managers
  private tabManagers: Map<number, TabManagers> = new Map();

  // Window Space Maps
  public windowActiveSpaceMap: Map<number, string>;
  public spaceActiveTabMap: Map<WindowSpaceReference, Tab | TabGroup>;
  public spaceFocusedTabMap: Map<WindowSpaceReference, Tab>;
  /** Activation history stores both tab IDs (number) and group IDs (string) */
  public spaceActivationHistory: Map<WindowSpaceReference, (number | string)[]>;

  // Tab Groups (keyed by string groupId)
  public tabGroups: Map<string, TabGroup>;
  private tabGroupCounter: number = 0;

  constructor() {
    super();

    this.tabs = new Map();

    this.windowActiveSpaceMap = new Map();
    this.spaceActiveTabMap = new Map();
    this.spaceFocusedTabMap = new Map();
    this.spaceActivationHistory = new Map();

    this.tabGroups = new Map();
    this.tabGroupCounter = 0;

    // Setup event listeners
    this.on("active-tab-changed", (windowId, spaceId) => {
      if (quitController.isQuitting) return;
      this.processActiveTabChange(windowId, spaceId);
      windowTabsChanged(windowId);
    });

    this.on("current-space-changed", (windowId, spaceId) => {
      if (quitController.isQuitting) return;
      this.processActiveTabChange(windowId, spaceId);
      windowTabsChanged(windowId);
    });

    this.on("tab-created", (tab) => {
      if (quitController.isQuitting) return;
      windowTabsChanged(tab.getWindow().id);
    });

    this.on("tab-removed", (tab) => {
      if (quitController.isQuitting) return;
      windowTabsChanged(tab.getWindow().id);
    });

    // Archive/sleep check interval
    const interval = setInterval(() => {
      for (const tab of this.tabs.values()) {
        if (tab.ephemeral) continue;
        if (!tab.visible && shouldArchiveTab(tab.lastActiveAt)) {
          tab.destroy();
          continue;
        }
        if (!tab.visible && !tab.asleep && shouldSleepTab(tab.lastActiveAt)) {
          const managers = this.getTabManagers(tab.id);
          managers?.lifecycle.putToSleep();
        }
      }
    }, ARCHIVE_CHECK_INTERVAL_MS);

    this.on("destroyed", () => {
      clearInterval(interval);
    });
  }

  // --- Manager access ---

  /**
   * Get the managers for a tab by tab ID.
   */
  public getTabManagers(tabId: number): TabManagers | undefined {
    return this.tabManagers.get(tabId);
  }

  /**
   * Get the lifecycle manager for a tab.
   */
  public getLifecycleManager(tabId: number): TabLifecycleManager | undefined {
    return this.tabManagers.get(tabId)?.lifecycle;
  }

  /**
   * Get the layout manager for a tab.
   */
  public getLayoutManager(tabId: number): TabLayoutManager | undefined {
    return this.tabManagers.get(tabId)?.layout;
  }

  // --- Tab Creation ---

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
    if (!windowId) {
      const focusedWindow = browserWindowsController.getFocusedWindow();
      if (focusedWindow) {
        windowId = focusedWindow.id;
      } else {
        const windows = browserWindowsController.getWindows();
        if (windows.length > 0) {
          windowId = windows[0].id;
        } else {
          throw new Error("Could not determine window ID for new tab");
        }
      }
    }

    // Get profile ID and space ID if not provided
    if (!profileId) {
      const lastUsedSpace = await spacesController.getLastUsed();
      if (lastUsedSpace) {
        profileId = lastUsedSpace.profileId;
        spaceId = lastUsedSpace.id;
      } else {
        throw new Error("Could not determine profile ID for new tab");
      }
    } else if (!spaceId) {
      try {
        const lastUsedSpace = await spacesController.getLastUsedFromProfile(profileId);
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
    await loadedProfilesController.load(profileId);

    // Create tab
    return this.internalCreateTab(windowId, profileId, spaceId, webContentsViewOptions, tabCreationOptions);
  }

  /**
   * Internal method to create a tab.
   * Wires up lifecycle, layout, and bounds managers.
   */
  public internalCreateTab(
    windowId: number,
    profileId: string,
    spaceId: string,
    webContentsViewOptions?: Electron.WebContentsViewConstructorOptions,
    tabCreationOptions: Partial<TabCreationOptions> = {}
  ) {
    // Get window
    const window = browserWindowsController.getWindowById(windowId);
    if (!window) {
      throw new Error("Window not found");
    }

    // Get loaded profile
    const profile = loadedProfilesController.get(profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const profileSession = profile.session;

    // Create tab
    const tab = new Tab(
      {
        tabsController: this,
        profileId: profileId,
        spaceId: spaceId,
        session: profileSession,
        loadedProfile: profile
      },
      {
        window: window,
        webContentsViewOptions,
        ...tabCreationOptions
      }
    );

    // --- Wire up managers ---
    const lifecycleManager = new TabLifecycleManager(tab);
    const boundsController = new TabBoundsController(tab);
    const layoutManager = new TabLayoutManager(tab, this, boundsController, lifecycleManager);

    this.tabManagers.set(tab.id, {
      lifecycle: lifecycleManager,
      layout: layoutManager,
      bounds: boundsController
    });

    // Setup fullscreen listeners via lifecycle manager (only for awake tabs)
    if (!tabCreationOptions.asleep) {
      lifecycleManager.setupFullScreenListeners(window);
    }

    this.tabs.set(tab.id, tab);

    // --- Handle deferred initialization ---

    // Handle initial sleep — set pre-sleep state directly on the lifecycle manager
    if (tabCreationOptions.asleep) {
      const { navHistory, navHistoryIndex } = tabCreationOptions;
      if (navHistory && navHistory.length > 0) {
        lifecycleManager.preSleepState = {
          url: navHistory[navHistoryIndex ?? navHistory.length - 1]?.url ?? "",
          navHistory: [...navHistory],
          navHistoryIndex: navHistoryIndex ?? navHistory.length - 1
        };
      }
    }

    // Handle initial URL load (only if not restoring from nav history)
    if (tab._needsInitialLoad) {
      const initialURL = tabCreationOptions.url || tab.loadedProfile.newTabUrl || NEW_TAB_URL;
      setImmediate(() => {
        tab.loadURL(initialURL);
      });
    }

    // --- Setup event listeners ---
    tab.on("updated", (properties) => {
      // During quit, the database is already closed — skip all persistence
      // and IPC. WebContents teardown fires navigation/load events that
      // propagate here, and accessing the closed DB would crash.
      if (quitController.isQuitting) return;

      // When the tab's view is destroyed (sleep), reset cached view state
      // so that bounds and border radius are re-applied to the new view on wake.
      if (properties.includes("asleep") && tab.asleep) {
        layoutManager.onViewDestroyed();
      }

      // Content-only changes (title, url, isLoading, etc.) use the
      // lightweight content-changed path which only serializes THIS tab
      // instead of all tabs in the window.
      windowTabContentChanged(tab.getWindow().id, tab.id);

      // Mark tab dirty for persistence
      if (!tab.ephemeral) {
        const windowGroupId = `w-${tab.getWindow().id}`;
        const serialized = serializeTab(tab, windowGroupId, lifecycleManager.preSleepState);
        tabPersistenceManager.markDirty(tab.uniqueId, serialized);
      }
    });
    tab.on("space-changed", () => {
      if (quitController.isQuitting) return;

      // Structural change — needs full data refresh (tab moved between spaces)
      windowTabsChanged(tab.getWindow().id);

      // Mark tab dirty for persistence
      if (!tab.ephemeral) {
        const windowGroupId = `w-${tab.getWindow().id}`;
        const serialized = serializeTab(tab, windowGroupId, lifecycleManager.preSleepState);
        tabPersistenceManager.markDirty(tab.uniqueId, serialized);
      }
    });
    tab.on("window-changed", (oldWindowId) => {
      if (quitController.isQuitting) return;

      // Structural change — refresh both old window (tab removed) and new window (tab added)
      windowTabsChanged(tab.getWindow().id);
      if (oldWindowId !== tab.getWindow().id) {
        windowTabsChanged(oldWindowId);
      }

      // Mark tab dirty for persistence
      if (!tab.ephemeral) {
        const windowGroupId = `w-${tab.getWindow().id}`;
        const serialized = serializeTab(tab, windowGroupId, lifecycleManager.preSleepState);
        tabPersistenceManager.markDirty(tab.uniqueId, serialized);
      }
    });
    tab.on("focused", () => {
      if (this.isTabActive(tab)) {
        this.setFocusedTab(tab);
      }
    });

    // Handle fullscreen changes — update layout
    tab.on("fullscreen-changed", () => {
      layoutManager.updateLayout();
    });

    // Handle new-tab-requested — replaces old Tab.createNewTab()
    tab.on("new-tab-requested", (url, disposition, constructorOptions, handlerDetails) => {
      this.handleNewTabRequested(tab, url, disposition, constructorOptions, handlerDetails);
    });

    tab.on("destroyed", () => {
      // Cleanup lifecycle
      lifecycleManager.onDestroy();
      boundsController.destroy();

      // During quit, skip all persistence and tab management — the database
      // is closed and windows are being torn down. Accessing them would crash.
      if (quitController.isQuitting) {
        this.tabManagers.delete(tab.id);
        this.tabs.delete(tab.id);
        return;
      }

      // Add to recently closed and remove from persistence (skip for ephemeral tabs)
      if (!tab.ephemeral) {
        const windowGroupId = `w-${tab.getWindow().id}`;
        const serialized = serializeTab(tab, windowGroupId, lifecycleManager.preSleepState);
        const group = this.getTabGroupByTabId(tab.id);
        const groupData = group ? serializeTabGroup(group) : undefined;
        recentlyClosedManager
          .add(serialized, groupData)
          .catch((err) => console.error("[TabsController] Failed to save recently closed tab:", err));

        // Remove from persistence
        tabPersistenceManager.markRemoved(tab.uniqueId);
      }

      // Remove managers
      this.tabManagers.delete(tab.id);

      // Remove tab from controller
      this.removeTab(tab);
    });

    // --- Initial persistence ---
    if (!tab.ephemeral) {
      const windowGroupId = `w-${windowId}`;
      const serialized = serializeTab(tab, windowGroupId, lifecycleManager.preSleepState);
      tabPersistenceManager.markDirty(tab.uniqueId, serialized);
    }

    // Return tab
    this.emit("tab-created", tab);
    return tab;
  }

  /**
   * Handles the "new-tab-requested" event from a tab.
   * This replaces the old Tab.createNewTab() method.
   */
  private handleNewTabRequested(
    sourceTab: Tab,
    url: string,
    disposition: "new-window" | "foreground-tab" | "background-tab" | "default" | "other",
    constructorOptions: Electron.WebContentsViewConstructorOptions | undefined,
    handlerDetails: Electron.HandlerDetails | undefined
  ) {
    let windowId = sourceTab.getWindow().id;

    if (disposition === "new-window") {
      const parsedFeatures: Record<string, string | number> = {};
      if (handlerDetails?.features) {
        const features = handlerDetails.features.split(",");
        for (const feature of features) {
          const [key, value] = feature.trim().split("=");
          if (key && value) {
            parsedFeatures[key] = Number.isNaN(+value) ? value : +value;
          }
        }
      }

      const popupWindow = browserWindowsController.instantCreate("popup", {
        ...(parsedFeatures.width ? { width: +parsedFeatures.width } : {}),
        ...(parsedFeatures.height ? { height: +parsedFeatures.height } : {}),
        ...(parsedFeatures.left ? { x: +parsedFeatures.left } : {}),
        ...(parsedFeatures.top ? { y: +parsedFeatures.top } : {})
      });
      windowId = popupWindow.id;

      // Keep popup in the same space as the source tab
      setWindowSpace(popupWindow, sourceTab.spaceId);
    }

    const newTab = this.internalCreateTab(windowId, sourceTab.profileId, sourceTab.spaceId, constructorOptions, {
      url
    });

    // Set the webContents reference so the createWindow callback can return it
    sourceTab._lastCreatedWebContents = newTab.webContents;

    // Handle Glance tab groups if enabled
    if (FLAGS.GLANCE_ENABLED && disposition === "foreground-tab") {
      const existingGroup = this.getTabGroupByTabId(sourceTab.id);
      if (existingGroup && existingGroup.mode === "glance") {
        // Add the new tab to the existing glance group
        existingGroup.addTab(newTab.id);
        existingGroup.setFrontTab(newTab.id);
        this.setActiveTab(existingGroup);
      } else {
        // Create a new glance group with the source tab and new tab
        const glanceGroup = this.createTabGroup("glance", [sourceTab.id, newTab.id]);
        if (glanceGroup.mode === "glance") {
          glanceGroup.setFrontTab(newTab.id);
        }
        this.setActiveTab(glanceGroup);
      }
    } else if (disposition === "foreground-tab" || disposition === "new-window") {
      this.setActiveTab(newTab);
    }

    // Keep source window in the same space for non-popup tab opens
    if (disposition !== "new-window") {
      setWindowSpace(sourceTab.getWindow(), sourceTab.spaceId);
    }
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
        win.browserWindow.focus();

        // Set active tab
        this.setActiveTab(tab);
      }

      return true;
    }
    return false;
  }

  // --- Active Tab Management ---

  /**
   * Process an active tab change — show/hide tabs and update layouts.
   */
  private processActiveTabChange(windowId: number, spaceId: string) {
    const tabsInWindow = this.getTabsInWindow(windowId);
    for (const tab of tabsInWindow) {
      const managers = this.getTabManagers(tab.id);
      if (!managers) continue;

      if (tab.spaceId === spaceId) {
        const isActive = this.isTabActive(tab);
        if (isActive && !tab.visible) {
          managers.layout.show();
        } else if (!isActive && tab.visible) {
          // Exit fullscreen if the tab is no longer active
          if (tab.fullScreen) {
            managers.lifecycle.setFullScreen(false);
          }
          managers.layout.hide();
        } else {
          // Update layout even if visibility hasn't changed, e.g., for split view resizing
          managers.layout.updateLayout();
        }
      } else {
        // Not in active space — also exit fullscreen if needed
        if (tab.fullScreen) {
          managers.lifecycle.setFullScreen(false);
        }
        managers.layout.hide();
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
    let idToStore: number | string;

    if (tabOrGroup instanceof Tab) {
      windowId = tabOrGroup.getWindow().id;
      spaceId = tabOrGroup.spaceId;
      tabToFocus = tabOrGroup;
      idToStore = tabOrGroup.id;
    } else {
      windowId = tabOrGroup.windowId;
      spaceId = tabOrGroup.spaceId;
      tabToFocus = tabOrGroup.tabs.length > 0 ? tabOrGroup.tabs[0] : undefined;
      idToStore = tabOrGroup.groupId;
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
        if (typeof itemId === "number") {
          // Check if it's an existing Tab
          const tab = this.getTabById(itemId);
          if (tab && !tab.isDestroyed && tab.getWindow().id === windowId && tab.spaceId === spaceId) {
            this.setActiveTab(tab);
            return;
          }
        } else {
          // String — check if it's an existing TabGroup
          const group = this.getTabGroupById(itemId);
          if (
            group &&
            !group.isDestroyed &&
            group.tabs.length > 0 &&
            group.windowId === windowId &&
            group.spaceId === spaceId
          ) {
            this.setActiveTab(group);
            return;
          }
        }
      }
    }

    // Find the next available tab or group in the same window/space to activate
    const tabsInSpace = this.getTabsInWindowSpace(windowId, spaceId);
    const groupsInSpace = this.getTabGroupsInWindow(windowId).filter(
      (group) => group.spaceId === spaceId && !group.isDestroyed && group.tabs.length > 0
    );

    // Prioritize setting a non-empty group as active if available
    if (groupsInSpace.length > 0) {
      this.setActiveTab(groupsInSpace[0]);
    } else if (tabsInSpace.length > 0) {
      this.setActiveTab(tabsInSpace[0]);
    } else {
      // No valid tabs or groups left
      this.emit("active-tab-changed", windowId, spaceId);
    }
  }

  /**
   * Set the focused tab for a space
   */
  private setFocusedTab(tab: Tab) {
    const windowSpaceReference = `${tab.getWindow().id}-${tab.spaceId}` as WindowSpaceReference;
    this.spaceFocusedTabMap.set(windowSpaceReference, tab);
    tab.webContents?.focus();
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

  // --- Tab Removal ---

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
        if (this.getFocusedTab(windowId, spaceId)?.id === tab.id) {
          const nextFocus = activeElement.tabs.find((t: Tab) => t.id !== tab.id);
          if (nextFocus) {
            this.setFocusedTab(nextFocus);
          } else {
            this.removeFocusedTab(windowId, spaceId);
          }
        }
        // Check if group is now empty
        if (activeElement && activeElement.tabs.length === 0) {
          this.destroyTabGroup(activeElement.groupId);
        }
      } else {
        // If the active element was the tab itself, remove it and find the next active.
        this.removeActiveTab(windowId, spaceId);
      }
    } else {
      // Tab was not active, just ensure it's removed from any group
      const group = this.getTabGroupByTabId(tab.id);
      if (group) {
        group.removeTab(tab.id);
        if (group.tabs.length === 0) {
          this.destroyTabGroup(group.groupId);
        }
      }
    }
  }

  // --- Tab Queries ---

  /**
   * Get a tab by id
   */
  public getTabById(tabId: number): Tab | undefined {
    return this.tabs.get(tabId);
  }

  /**
   * Mark a tab as ephemeral so it will no longer be persisted to the database.
   * Also removes any existing persisted data for this tab and notifies the
   * renderer to refresh the tab list (so the tab disappears from the sidebar).
   */
  public makeTabEphemeral(tabId: number): void {
    const tab = this.tabs.get(tabId);
    if (!tab || tab.ephemeral) return;
    tab.ephemeral = true;
    tabPersistenceManager.markRemoved(tab.uniqueId);
    // Trigger a structural change so the renderer drops this tab from the list
    windowTabsChanged(tab.getWindow().id);
  }

  /**
   * Reverse of makeTabEphemeral: mark a tab as persistent so it will be
   * persisted to the database again and reappear in the sidebar tab list.
   */
  public makeTabPersistent(tabId: number): void {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.ephemeral) return;
    tab.ephemeral = false;

    // Immediately serialize and mark dirty so it gets persisted on the next flush
    const lifecycleManager = this.tabManagers.get(tabId)?.lifecycle;
    const windowGroupId = `w-${tab.getWindow().id}`;
    const serialized = serializeTab(tab, windowGroupId, lifecycleManager?.preSleepState);
    tabPersistenceManager.markDirty(tab.uniqueId, serialized);

    // Trigger a structural change so the renderer adds this tab back to the list
    windowTabsChanged(tab.getWindow().id);
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

  // --- Tab Group Queries ---

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
   * Get a tab group by its string groupId
   */
  public getTabGroupById(groupId: string): TabGroup | undefined {
    return this.tabGroups.get(groupId);
  }

  // --- Tab Group Management ---

  /**
   * Create a new tab group
   */
  public createTabGroup(mode: TabGroupMode, initialTabIds: [number, ...number[]], preferredGroupId?: string): TabGroup {
    let groupId: string;
    if (preferredGroupId) {
      if (this.tabGroups.has(preferredGroupId)) {
        throw new Error(`Tab group ID already exists: ${preferredGroupId}`);
      }

      groupId = preferredGroupId;

      const groupIdMatch = /^tg-(\d+)$/.exec(preferredGroupId);
      if (groupIdMatch) {
        const parsedCounter = Number(groupIdMatch[1]);
        if (Number.isFinite(parsedCounter)) {
          this.tabGroupCounter = Math.max(this.tabGroupCounter, parsedCounter + 1);
        }
      }
    } else {
      do {
        groupId = `tg-${this.tabGroupCounter++}`;
      } while (this.tabGroups.has(groupId));
    }

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
        tabGroup = new GlanceTabGroup(this, groupId, initialTabs as [Tab, ...Tab[]]);
        break;
      case "split":
        tabGroup = new SplitTabGroup(this, groupId, initialTabs as [Tab, ...Tab[]]);
        break;
      default:
        throw new Error(`Invalid tab group mode: ${mode}`);
    }

    tabGroup.on("destroyed", () => {
      // Ensure cleanup happens even if destroyTabGroup isn't called externally
      if (this.tabGroups.has(groupId)) {
        this.internalDestroyTabGroup(tabGroup);
      }
    });

    tabGroup.on("changed", () => {
      // Skip persistence during quit — the database is already closed
      if (quitController.isQuitting) return;

      // Persist tab group state whenever it mutates
      tabPersistenceManager
        .saveTabGroup(groupId, serializeTabGroup(tabGroup))
        .catch((err) => console.error("[TabsController] Failed to save tab group:", err));
    });

    this.tabGroups.set(groupId, tabGroup);

    // Persist the tab group
    tabPersistenceManager
      .saveTabGroup(groupId, serializeTabGroup(tabGroup))
      .catch((err) => console.error("[TabsController] Failed to save tab group:", err));

    // If any of the initial tabs were active, make the new group active.
    const firstTab = initialTabs[0];
    const currentActive = this.getActiveTab(firstTab.getWindow().id, firstTab.spaceId);
    const currentActiveIsFirstTab = currentActive instanceof Tab && currentActive.id === firstTab.id;
    if (currentActiveIsFirstTab) {
      this.setActiveTab(tabGroup);
    } else {
      // Ensure layout is updated for grouped tabs
      for (const t of tabGroup.tabs) {
        const managers = this.getTabManagers(t.id);
        managers?.layout.updateLayout();
      }
    }

    return tabGroup;
  }

  /**
   * Get the smallest position of all tabs
   */
  public getSmallestPosition(): number {
    let smallestPosition = 999;
    for (const tab of this.tabs.values()) {
      if (tab.position < smallestPosition) {
        smallestPosition = tab.position;
      }
    }
    return smallestPosition;
  }

  /**
   * Internal method to cleanup destroyed tab group state
   */
  private internalDestroyTabGroup(tabGroup: TabGroup) {
    const wasActive = this.getActiveTab(tabGroup.windowId, tabGroup.spaceId) === tabGroup;
    const groupId = tabGroup.groupId;

    if (!this.tabGroups.has(groupId)) return;

    this.tabGroups.delete(groupId);
    this.removeFromActivationHistory(groupId);

    // Remove from persistence (skip during quit — DB is closed)
    if (!quitController.isQuitting) {
      tabPersistenceManager.removeTabGroup(groupId);
    }

    if (wasActive) {
      this.removeActiveTab(tabGroup.windowId, tabGroup.spaceId);
    }
  }

  /**
   * Destroy a tab group
   */
  public destroyTabGroup(groupId: string) {
    const tabGroup = this.getTabGroupById(groupId);
    if (!tabGroup) {
      console.warn(`Attempted to destroy non-existent tab group ID: ${groupId}`);
      return;
    }

    // Ensure group's destroy logic runs first
    if (!tabGroup.isDestroyed) {
      tabGroup.destroy(); // This triggers the "destroyed" event
    }

    // Cleanup TabsController state (might be redundant if event handler runs, but safe)
    this.internalDestroyTabGroup(tabGroup);
  }

  // --- Window Space Management ---

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
      const managers = this.getTabManagers(tab.id);
      managers?.layout.updateLayout();
    }
  }

  // --- Activation History ---

  /**
   * Helper method to remove an item ID from all activation history lists.
   * Handles both tab IDs (number) and group IDs (string).
   */
  private removeFromActivationHistory(itemId: number | string) {
    for (const [key, history] of this.spaceActivationHistory.entries()) {
      const initialLength = history.length;
      const newHistory = history.filter((id) => id !== itemId);
      if (newHistory.length < initialLength) {
        if (newHistory.length === 0) {
          this.spaceActivationHistory.delete(key);
        } else {
          this.spaceActivationHistory.set(key, newHistory);
        }
      }
    }
  }

  // --- Position Normalization ---

  /**
   * Normalize tab positions to prevent drift to negative infinity.
   * Called periodically or when positions are getting too extreme.
   */
  public normalizePositions(windowId: number, spaceId: string) {
    const tabs = this.getTabsInWindowSpace(windowId, spaceId);
    if (tabs.length === 0) return;

    // Sort by current position
    tabs.sort((a, b) => a.position - b.position);

    // Reassign positions starting from 0
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].updateStateProperty("position", i);
    }
  }
}

export { type TabsController };
export const tabsController = new TabsController();
