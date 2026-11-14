import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { Tab, TabCreationDetails, TabCreationOptions } from "./core/tab";
import { TabLayoutNode } from "./core/tab-layout-node";
import { PinnedTab } from "./core/pinned-tab";
import { RecentlyClosedManager } from "./core/recently-closed-manager";
import { showTabContextMenu, showPinnedTabContextMenu } from "./core/tab-context-menus";
import { TabLayout } from "./layout/tab-layout";
import { TabPositioner } from "./layout/tab-positioner";
import { PinnedTabPersistence } from "./persistence/pinned-tab-persistence";
import { startTabLifecycleTimer } from "./tab-lifecycle-timer";
import {
  NavigationEntry,
  PersistedTabData,
  RecentlyClosedTabData,
  TabLayoutNodeMode,
  TAB_SERVICE_SCHEMA_VERSION
} from "~/types/tab-service";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { spacesController } from "@/controllers/spaces-controller";
import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { WebContents } from "electron";
import { quitController } from "@/controllers/quit-controller";
import { setWindowSpace } from "@/ipc/session/spaces";
import { FLAGS } from "@/modules/flags";
import { sendPlaceholderForTab } from "./tab-sync";

export const NEW_TAB_URL = "flow://new-tab";

type TabServiceEvents = {
  "tab-created": [Tab];
  "tab-removed": [Tab];
  "active-changed": [windowId: number, spaceId: string];
  "focused-tab-changed": [windowId: number, spaceId: string];
  "pinned-tab-changed": [];
  "structural-change": [windowId: number];
  "content-change": [windowId: number, tabId: number];
  destroyed: [];
};

/**
 * TabService — the central orchestrator for tab management.
 *
 * Manages:
 * - All tabs (Map<tabId, Tab>)
 * - All pinned tabs (Map<uniqueId, PinnedTab>)
 * - Per-window-space layouts (Map<`${windowId}-${spaceId}`, TabLayout>)
 * - A shared TabPositioner
 *
 * Coordinates tab creation, destruction, activation, pinned tab operations,
 * and communication with the renderer via events.
 */
export class TabService extends TypedEventEmitter<TabServiceEvents> {
  // All tabs
  public readonly tabs: Map<number, Tab> = new Map();

  // Per-window-space layouts (key: `${windowId}-${spaceId}`)
  public readonly layouts: Map<string, TabLayout> = new Map();

  // Pinned tabs
  public readonly pinnedTabs: Map<string, PinnedTab> = new Map();

  // Recently closed
  public readonly recentlyClosed: RecentlyClosedManager = new RecentlyClosedManager();

  // Shared positioner
  public readonly positioner: TabPositioner = new TabPositioner();

  // --- Indexes for O(1) lookups ---
  private readonly windowIndex: Map<number, Set<Tab>> = new Map();
  private readonly spaceIndex: Map<string, Set<Tab>> = new Map();
  private readonly webContentsIndex: WeakMap<WebContents, Tab> = new WeakMap();

  // PiP counter — avoids iterating all tabs to check if any is in PiP
  private _pipCount: number = 0;

  // Emission suppression for batch operations (e.g., session restore).
  // While > 0, structural/content emissions are deferred.
  private _suppressEmissions: number = 0;
  private _deferredStructural: Set<number> = new Set();

  /**
   * Hook for tab-sync: moves a tab to another window with placeholder handling.
   * Set by initTabSync() to avoid circular dependency.
   */
  public moveTabToWindowHook: ((tab: Tab, window: BrowserWindow) => Promise<void>) | null = null;

  // Persistence delegate
  private readonly pinnedTabDb = new PinnedTabPersistence();

  // --- Initialization ---

  /**
   * Load all pinned tabs from the database into memory.
   * Called once during app startup.
   */
  public loadPinnedTabs(): void {
    const pinnedTabs = this.pinnedTabDb.loadAll();
    for (const pinnedTab of pinnedTabs) {
      this.pinnedTabs.set(pinnedTab.uniqueId, pinnedTab);
      this.wirePinnedTabEvents(pinnedTab);
    }
  }

  /**
   * Start background tasks: space-deletion cleanup & auto-sleep/archive timer.
   * Called once during initialization.
   */
  public startBackgroundTasks(): void {
    spacesController.on("space-deleted", (_profileId, spaceId) => {
      if (quitController.isQuitting) return;
      for (const tab of this.getTabsInSpace(spaceId)) {
        tab.destroy();
      }
    });

    startTabLifecycleTimer(this.tabs);
  }

  // --- Tab Creation ---

  /**
   * Create a new tab with automatic window/profile/space resolution.
   */
  public async createTab(
    windowId?: number,
    profileId?: string,
    spaceId?: string,
    webContentsViewOptions?: Electron.WebContentsViewConstructorOptions,
    options: Partial<TabCreationOptions> = {}
  ): Promise<Tab> {
    // Resolve window
    if (!windowId) {
      const focusedWindow = browserWindowsController.getFocusedWindow();
      if (focusedWindow) {
        windowId = focusedWindow.id;
      } else {
        const windows = browserWindowsController.getWindows();
        if (windows.length > 0) {
          windowId = windows[0].id;
        } else {
          throw new Error("No window available for new tab");
        }
      }
    }

    // Resolve profile/space from window
    if (!profileId || !spaceId) {
      const window = browserWindowsController.getWindowById(windowId);
      if (window?.currentSpaceId) {
        const spaceData = await spacesController.get(window.currentSpaceId);
        if (spaceData) {
          profileId = profileId || spaceData.profileId;
          spaceId = spaceId || window.currentSpaceId;
        }
      }
    }

    // Fallback to last used space
    if (!profileId) {
      const lastUsedSpace = await spacesController.getLastUsed();
      if (lastUsedSpace) {
        profileId = lastUsedSpace.profileId;
        spaceId = spaceId || lastUsedSpace.id;
      } else {
        throw new Error("Could not determine profile for new tab");
      }
    } else if (!spaceId) {
      const lastUsedSpace = await spacesController.getLastUsedFromProfile(profileId);
      if (lastUsedSpace) {
        spaceId = lastUsedSpace.id;
      } else {
        throw new Error("Could not determine space for new tab");
      }
    }

    // Load profile
    await loadedProfilesController.load(profileId);

    const window = browserWindowsController.getWindowById(windowId);
    if (window && !window.currentSpaceId) {
      window.setCurrentSpace(spaceId!);
    }

    return this.createTabInternal(windowId, profileId, spaceId!, webContentsViewOptions, options);
  }

  /**
   * Internal tab creation — assumes all parameters are resolved.
   */
  public createTabInternal(
    windowId: number,
    profileId: string,
    spaceId: string,
    webContentsViewOptions?: Electron.WebContentsViewConstructorOptions,
    options: Partial<TabCreationOptions> = {}
  ): Tab {
    const window = browserWindowsController.getWindowById(windowId);
    if (!window) throw new Error("Window not found");

    const profile = loadedProfilesController.get(profileId);
    if (!profile) throw new Error("Profile not found");

    // Compute position if not provided
    if (options.position === undefined) {
      const tabsInSpace = this.getTabsInWindowSpace(windowId, spaceId);
      options.position = this.positioner.getInsertTopPosition(tabsInSpace);
    }

    // Create the tab
    const details: TabCreationDetails = {
      profileId,
      spaceId,
      session: profile.session,
      loadedProfile: profile
    };

    const tab = new Tab(details, {
      window,
      webContentsViewOptions,
      ...options
    } as TabCreationOptions);

    // Register tab and update indexes
    this.tabs.set(tab.id, tab);
    this.addToIndex(this.windowIndex, tab.getWindow().id, tab);
    this.addToIndex(this.spaceIndex, tab.spaceId, tab);
    if (tab.webContents) this.webContentsIndex.set(tab.webContents, tab);

    // Get or create layout for this window-space
    const layout = this.getOrCreateLayout(windowId, spaceId!);

    // Create a single layout node for this tab
    layout.createSingleNode(tab);

    // Wire up tab events
    this.wireTabEvents(tab);

    // Activate the new tab unless explicitly suppressed or created asleep
    if (options.makeActive !== false && !tab.asleep) {
      this.activateTab(tab);
    }

    // Load initial URL if needed
    if (tab._needsInitialLoad && options.noLoadURL !== true) {
      const initialURL = options.url || profile.newTabUrl || NEW_TAB_URL;
      if (options.typedNavigation) {
        tab.markTypedNavigationForNextHistoryVisit(initialURL);
      }
      tab.loadURL(initialURL);
    }

    this.emit("tab-created", tab);
    this.emitStructuralChange(windowId);

    // Notify extensions that indices changed for all tabs in the same window+profile
    this.notifyIndexChanges(windowId, profileId);

    return tab;
  }

  // --- Tab Destruction ---

  /**
   * Remove and clean up a tab.
   */
  public destroyTab(tabId: number): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    tab.destroy();
  }

  // --- Tab Queries ---

  public getTabById(tabId: number): Tab | undefined {
    return this.tabs.get(tabId);
  }

  public getTabByWebContents(webContents: WebContents): Tab | undefined {
    return this.webContentsIndex.get(webContents);
  }

  public getTabsInWindow(windowId: number): Tab[] {
    const set = this.windowIndex.get(windowId);
    return set ? Array.from(set) : [];
  }

  public getTabsInSpace(spaceId: string): Tab[] {
    const set = this.spaceIndex.get(spaceId);
    return set ? Array.from(set) : [];
  }

  public getTabsInWindowSpace(windowId: number, spaceId: string): Tab[] {
    // Use the smaller index as the base for intersection
    const windowSet = this.windowIndex.get(windowId);
    const spaceSet = this.spaceIndex.get(spaceId);
    if (!windowSet || !spaceSet) return [];

    const result: Tab[] = [];
    const smaller = windowSet.size <= spaceSet.size ? windowSet : spaceSet;
    const larger = smaller === windowSet ? spaceSet : windowSet;
    for (const tab of smaller) {
      if (larger.has(tab)) result.push(tab);
    }
    return result;
  }

  public getTabsInProfile(profileId: string): Tab[] {
    const result: Tab[] = [];
    for (const tab of this.tabs.values()) {
      if (tab.profileId === profileId) result.push(tab);
    }
    return result;
  }

  public getTabsInWindowProfile(windowId: number, profileId: string): Tab[] {
    return this.getTabsInWindow(windowId)
      .filter((tab) => tab.profileId === profileId)
      .sort((a, b) => a.position - b.position);
  }

  public getTabIndexInWindowProfile(tab: Tab): number {
    return this.getTabsInWindowProfile(tab.getWindow().id, tab.profileId).findIndex(
      (candidate) => candidate.id === tab.id
    );
  }

  public clearBrowsingHistoryDedupingForProfile(profileId: string, url?: string): void {
    for (const tab of this.getTabsInProfile(profileId)) {
      tab.clearBrowsingHistoryDeduping(url);
    }
  }

  // --- Active Tab Management ---

  /**
   * Activate a layout node (makes it visible).
   */
  public activateNode(windowId: number, spaceId: string, node: TabLayoutNode): void {
    const layout = this.getLayout(windowId, spaceId);
    if (!layout) return;

    layout.setActiveNode(node);

    // Update view visibility and bounds
    this.updateTabVisibility(windowId, spaceId);
    this.handlePageBoundsChanged(windowId);

    // Notify renderer of active node change
    this.emitStructuralChange(windowId);
  }

  /**
   * Activate a tab by finding its layout node and making it active.
   * Wakes the tab if it is sleeping so the view is available.
   */
  private _activatingTabIds = new Set<number>();

  public activateTab(tab: Tab): void {
    // Guard against re-entry (extensions.addTab can fire selectTab → activateTab)
    if (this._activatingTabIds.has(tab.id)) return;

    const windowId = tab.getWindow().id;
    const window = browserWindowsController.getWindowById(windowId);

    // For pinned tabs (multi-layout nodes), prefer the window's current space layout
    // since pinned nodes span all profile spaces and tab.spaceId is just the creation space.
    let layout: TabLayout | undefined;
    if (window?.currentSpaceId) {
      const currentLayout = this.getLayout(windowId, window.currentSpaceId);
      if (currentLayout?.getNodeForTab(tab.id)) {
        layout = currentLayout;
      }
    }
    if (!layout) {
      layout = this.getLayout(windowId, tab.spaceId);
    }
    if (!layout) return;

    const node = layout.getNodeForTab(tab.id);
    if (!node) return;

    this._activatingTabIds.add(tab.id);
    try {
      // Wake sleeping tabs so the view exists for display
      if (tab.asleep) {
        tab.wakeUp();
      }

      // For multi-tab nodes (glance), set front tab
      if (node.mode === "glance") {
        node.setFrontTab(tab);
      }

      layout.setActiveNode(node);
      layout.setFocusedTab(tab);

      // Mark as recently active (prevents premature archive/sleep)
      tab.lastActiveAt = Math.floor(Date.now() / 1000);

      // Only update visibility/bounds if this layout's space is the window's current space.
      // A tab can be activated in a non-current space (e.g. STAW release) without
      // making it visible — it becomes visible when the user switches to that space.
      if (window && !window.destroyed && window.currentSpaceId === layout.spaceId) {
        this.updateTabVisibility(windowId, layout.spaceId);
        this.handlePageBoundsChanged(windowId);
      }

      // Record browsing history on activation (deduped)
      tab.recordBrowsingHistoryOnActivationIfNeeded();

      // Notify extensions of the active tab change
      if (tab.webContents && !tab.webContents.isDestroyed()) {
        tab.loadedProfile.extensions.selectTab(tab.webContents);
      }

      // Focus the tab's layer through the LayerManager — but only if the
      // window is currently focused. Calling webContents.focus() on a
      // background window would steal OS focus (same issue reallocateFocus
      // defers to avoid). When the window later gains focus, the deferred
      // reallocateFocus handles it.
      if (tab.layer && window && !window.destroyed && window.browserWindow.isFocused()) {
        tab.layer.focus();
      }

      // Notify renderer of active tab change
      this.emitStructuralChange(windowId);
    } finally {
      this._activatingTabIds.delete(tab.id);
    }
  }

  /**
   * Ensure a tab's node exists in the target window's current-space layout and
   * set it as the activeLayout (for STAW cross-window moves).
   *
   * With multi-layout membership, nodes are never destroyed during cross-window
   * moves. The node stays registered in the source layout (which shows a
   * placeholder) and is registered in the target layout (which shows real content).
   *
   * For pinned tabs the node already exists in all profile layouts via propagation,
   * so this just flips activeLayout. For normal STAW tabs the node is registered
   * in the target layout if not already present.
   */
  public ensureNodeInLayout(tab: Tab, toWindowId: number): void {
    const fromWindowId = tab.getWindow().id;
    if (fromWindowId === toWindowId) return;

    const targetWindow = browserWindowsController.getWindowById(toWindowId);
    const targetSpaceId = targetWindow?.currentSpaceId ?? tab.spaceId;
    const toLayout = this.getOrCreateLayout(toWindowId, targetSpaceId);

    // Find the node: try the target layout first (pinned tabs are already there),
    // then fall back to looking up from the source window's layout.
    let node = toLayout.getNodeForTab(tab.id);
    if (!node) {
      const fromLayout = this.getLayout(fromWindowId, tab.spaceId);
      node = fromLayout?.getNodeForTab(tab.id);
      if (node) {
        toLayout.addExistingNode(node);
      }
    }

    if (node) {
      node.setActiveLayout(toLayout);
    } else {
      // No node found anywhere — create fresh in target
      toLayout.createSingleNode(tab);
    }
  }

  /**
   * Activate the next tab in visual order.
   */
  public activateNextTab(windowId: number, spaceId: string): void {
    const layout = this.getLayout(windowId, spaceId);
    if (!layout) return;
    const node = layout.getAdjacentNode(1);
    if (node?.frontTab) {
      this.activateTab(node.frontTab);
    }
  }

  /**
   * Activate the previous tab in visual order.
   */
  public activatePreviousTab(windowId: number, spaceId: string): void {
    const layout = this.getLayout(windowId, spaceId);
    if (!layout) return;
    const node = layout.getAdjacentNode(-1);
    if (node?.frontTab) {
      this.activateTab(node.frontTab);
    }
  }

  /**
   * Check if a tab is currently active in any layout of its window.
   */
  public isTabActive(tab: Tab): boolean {
    const windowId = tab.getWindow().id;
    for (const layout of this.layouts.values()) {
      if (layout.windowId !== windowId) continue;
      if (layout.isTabActive(tab)) return true;
    }
    return false;
  }

  /**
   * Get the focused tab for a space in a window.
   */
  public getFocusedTab(windowId: number, spaceId: string): Tab | undefined {
    return this.getLayout(windowId, spaceId)?.getFocusedTab() ?? undefined;
  }

  /**
   * Get the active layout node for a space in a window.
   */
  public getActiveNode(windowId: number, spaceId: string): TabLayoutNode | undefined {
    return this.getLayout(windowId, spaceId)?.getActiveNode() ?? undefined;
  }

  // --- Layout Node Operations ---

  /**
   * Create a multi-tab layout node (e.g., glance or split).
   */
  public createLayoutNode(
    windowId: number,
    mode: Exclude<TabLayoutNodeMode, "single">,
    tabIds: number[]
  ): TabLayoutNode | null {
    const tabs = tabIds.map((id) => this.tabs.get(id)).filter((t): t is Tab => !!t);
    if (tabs.length < 2) return null;

    const spaceId = tabs[0].spaceId;
    if (!tabs.every((tab) => tab.spaceId === spaceId && tab.getWindow().id === windowId)) {
      return null;
    }

    const layout = this.getLayout(windowId, spaceId);
    if (!layout) return null;

    // Remove tabs from their current single nodes
    for (const tab of tabs) {
      const existingNode = layout.getNodeForTab(tab.id);
      if (existingNode && existingNode.mode === "single") {
        layout.destroyNode(existingNode.id);
      } else if (existingNode) {
        existingNode.removeTab(tab);
      }
    }

    const node = layout.createMultiNode(mode, tabs);
    if (node) {
      this.emitStructuralChange(windowId);
    }
    return node;
  }

  /**
   * Dissolve a layout node back to individual single nodes.
   */
  public dissolveLayoutNode(nodeId: string, windowId: number): void {
    // Find the layout containing this node
    const layout = this.findLayoutWithNode(nodeId, windowId);
    if (!layout) return;

    const node = layout.getNode(nodeId);
    if (!node || node.mode === "single") return;

    const tabs = [...node.tabs];
    layout.destroyNode(nodeId);

    // Create individual nodes for each tab
    for (const tab of tabs) {
      layout.createSingleNode(tab);
    }

    // Activate the first tab
    if (tabs.length > 0) {
      this.activateTab(tabs[0]);
    }
  }

  /**
   * Find a layout in a window that contains a specific node.
   */
  private findLayoutWithNode(nodeId: string, windowId: number): TabLayout | undefined {
    for (const layout of this.getLayoutsForWindow(windowId)) {
      if (layout.getNode(nodeId)) return layout;
    }
    return undefined;
  }

  // --- Pinned Tabs ---

  /**
   * Create a pinned tab from an existing browser tab.
   */
  public createPinnedTabFromTab(tabId: number, position?: number): PinnedTab | null {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.url) return null;

    const maxPos = this.getMaxPinnedTabPosition(tab.profileId);
    const finalPosition = position ?? maxPos + 1;

    const pinnedTab = PinnedTab.create(tab.profileId, tab.url, tab.faviconURL, finalPosition);

    this.pinnedTabs.set(pinnedTab.uniqueId, pinnedTab);

    // Mark the tab as owned by this pinned tab (ephemeral — remove stale DB record)
    tab.owner = { kind: "pinned", pinnedTabId: pinnedTab.uniqueId };
    this.emitContentChange(tab.getWindow().id, tab.id);

    // Associate the tab
    pinnedTab.associate(tab.spaceId, tab.id);

    const layout = this.getLayout(tab.getWindow().id, tab.spaceId);
    const node = layout?.getNodeForTab(tab.id);
    if (node) {
      pinnedTab.layoutNode = node;
      this.propagatePinnedTabNode(node, pinnedTab.profileId);
    }

    this.wirePinnedTabEvents(pinnedTab);
    this.normalizePinnedTabPositions(tab.profileId);
    this.pinnedTabDb.save(pinnedTab);
    this.emit("pinned-tab-changed");
    this.emitStructuralChange(tab.getWindow().id);

    return pinnedTab;
  }

  /**
   * Remove a pinned tab. Associated tabs become normal.
   */
  public removePinnedTab(pinnedTabId: string): number[] {
    const pinnedTab = this.pinnedTabs.get(pinnedTabId);
    if (!pinnedTab) return [];

    const associatedTabIds = new Set<number>();
    const affectedWindowIds = new Set<number>();
    for (const tabId of new Set(pinnedTab.associations.values())) {
      associatedTabIds.add(tabId);
      // Make associated tabs normal again
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.owner = { kind: "normal" };
        affectedWindowIds.add(tab.getWindow().id);
        this.emitContentChange(tab.getWindow().id, tab.id);
      }
    }

    this.pinnedTabs.delete(pinnedTabId);
    this.pinnedTabDb.delete(pinnedTabId);
    pinnedTab.destroy();

    this.emit("pinned-tab-changed");
    for (const windowId of affectedWindowIds) {
      this.emitStructuralChange(windowId);
    }
    return [...associatedTabIds];
  }

  /**
   * Click a pinned tab — activate or create its associated tab.
   * Pinned tab nodes exist in all profile layouts. Clicking just sets the
   * target layout's active node — the node can be active in multiple layouts
   * simultaneously. For cross-window clicks, the tab's view moves to the
   * target window (since a view can only render in one window).
   */
  public async clickPinnedTab(pinnedTabId: string, window: BrowserWindow): Promise<boolean> {
    const pinnedTab = this.pinnedTabs.get(pinnedTabId);
    if (!pinnedTab) return false;

    const spaceId = window.currentSpaceId;
    if (!spaceId) return false;

    // Find the existing associated tab (any space)
    const existingTab = this.findAssociatedTab(pinnedTab);
    if (existingTab) {
      const targetLayout = this.getOrCreateLayout(window.id, spaceId);
      const node = targetLayout.getNodeForTab(existingTab.id);

      if (node) {
        // Node is already in this layout (propagated). Just activate it here.
        // For cross-window: move only the tab's view (NOT the layout node).
        // Pinned nodes stay in all layouts — we don't migrate them.
        if (existingTab.getWindow().id !== window.id) {
          const oldWindow = existingTab.getWindow();
          // Capture placeholder for old window before moving the view away
          await sendPlaceholderForTab(existingTab, oldWindow);
          // Re-check after async: tab or window may have been destroyed
          if (existingTab.isDestroyed || window.destroyed) return true;
          existingTab.setWindow(window);
          node.setActiveLayout(targetLayout);
        }

        // Update association to track which space last activated it
        pinnedTab.associate(spaceId, existingTab.id);

        this.reorderPinnedTabsInSpace(window.id, spaceId);
        targetLayout.setActiveNode(node);
        targetLayout.setFocusedTab(existingTab);
        this.activateTab(existingTab);
        return true;
      }

      // Node not in target layout (shouldn't happen if propagation worked, but fallback)
      this.activateTab(existingTab);
      return true;
    }

    // No existing tab — create one
    const tab = await this.createTab(window.id, pinnedTab.profileId, spaceId, undefined, {
      url: pinnedTab.defaultUrl,
      owner: { kind: "pinned", pinnedTabId: pinnedTab.uniqueId }
    });

    // Re-check after async: window or tab may have been destroyed during profile load.
    if (tab.isDestroyed || window.destroyed) {
      if (!tab.isDestroyed) tab.destroy();
      return true;
    }

    pinnedTab.associate(spaceId, tab.id);

    // Propagate pinned tab node to all layouts in the same profile
    const layout = this.getLayout(window.id, spaceId);
    if (layout) {
      const node = layout.getNodeForTab(tab.id);
      if (node) {
        pinnedTab.layoutNode = node;
        this.propagatePinnedTabNode(node, pinnedTab.profileId);
      }
    }

    this.reorderPinnedTabsInSpace(window.id, spaceId);
    this.activateTab(tab);
    return true;
  }

  /**
   * Find the live associated tab for a pinned tab (across all spaces).
   */
  private findAssociatedTab(pinnedTab: PinnedTab): Tab | null {
    for (const tabId of pinnedTab.associations.values()) {
      const tab = this.tabs.get(tabId);
      if (tab && !tab.isDestroyed) return tab;
    }
    return null;
  }

  /**
   * Register a pinned tab's layout node in all layouts belonging to the same profile.
   * The node uses activeLayout to determine which layout shows real content vs placeholder.
   */
  public propagatePinnedTabNode(node: TabLayoutNode, profileId: string): void {
    for (const layout of this.layouts.values()) {
      if (layout.getNode(node.id)) continue;
      // Check if this layout's space belongs to the same profile
      const spaceData = spacesController.getFromCache(layout.spaceId);
      if (spaceData && spaceData.profileId === profileId) {
        layout.addExistingNode(node);
      }
    }
  }

  /**
   * Double-click a pinned tab — navigate back to default URL.
   */
  public async doubleClickPinnedTab(pinnedTabId: string, window: BrowserWindow): Promise<boolean> {
    const pinnedTab = this.pinnedTabs.get(pinnedTabId);
    if (!pinnedTab) return false;

    const spaceId = window.currentSpaceId;
    if (!spaceId) return false;

    // Find existing tab across all spaces
    const existingTab = this.findAssociatedTab(pinnedTab);
    if (existingTab) {
      // Navigate back to default URL
      if (existingTab.url !== pinnedTab.defaultUrl) {
        existingTab.loadURL(pinnedTab.defaultUrl);
      }

      const targetLayout = this.getOrCreateLayout(window.id, spaceId);
      const node = targetLayout.getNodeForTab(existingTab.id);

      if (node) {
        // For cross-window: move only the view (not the node)
        if (existingTab.getWindow().id !== window.id) {
          const oldWindow = existingTab.getWindow();
          await sendPlaceholderForTab(existingTab, oldWindow);
          // Re-check after async: tab or window may have been destroyed
          if (existingTab.isDestroyed || window.destroyed) return true;
          existingTab.setWindow(window);
          node.setActiveLayout(targetLayout);
        }

        pinnedTab.associate(spaceId, existingTab.id);
        targetLayout.setActiveNode(node);
        targetLayout.setFocusedTab(existingTab);
      }

      this.activateTab(existingTab);
      return true;
    }

    // No associated tab — treat as single click
    return this.clickPinnedTab(pinnedTabId, window);
  }

  /**
   * Unpin a tab back to the tab list.
   */
  public async unpinToTabList(pinnedTabId: string, window?: BrowserWindow, position?: number): Promise<boolean> {
    const pinnedTab = this.pinnedTabs.get(pinnedTabId);
    if (!pinnedTab) return false;

    // Collect affected window IDs before destroying (which clears associations)
    const affectedWindowIds = new Set<number>();
    let convertedTab: Tab | null = null;

    const targetWindow = window && !window.destroyed ? window : browserWindowsController.getFocusedWindow();
    const currentSpaceId = targetWindow?.currentSpaceId;
    const currentSpaceTabId = currentSpaceId ? pinnedTab.getAssociatedTabId(currentSpaceId) : null;
    if (currentSpaceTabId !== null) {
      convertedTab = this.tabs.get(currentSpaceTabId) ?? null;
    }

    if (!convertedTab && targetWindow && currentSpaceId) {
      const space = await spacesController.get(currentSpaceId);
      if (space?.profileId === pinnedTab.profileId) {
        convertedTab = await this.createTab(targetWindow.id, pinnedTab.profileId, currentSpaceId, undefined, {
          url: pinnedTab.defaultUrl,
          owner: { kind: "normal" },
          position,
          makeActive: true
        });
        affectedWindowIds.add(convertedTab.getWindow().id);
        if (position !== undefined) {
          this.positioner.normalizePositions(
            this.getTabsInWindowSpace(convertedTab.getWindow().id, convertedTab.spaceId)
          );
        }
      }
    }

    if (!convertedTab) {
      convertedTab = this.findAssociatedTab(pinnedTab);
    }
    if (!convertedTab) return false;

    for (const tabId of new Set(pinnedTab.associations.values())) {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.owner = { kind: "normal" };
        if (tab === convertedTab && position !== undefined) {
          tab.updateStateProperty("position", position);
          this.positioner.normalizePositions(this.getTabsInWindowSpace(tab.getWindow().id, tab.spaceId));
        }
        affectedWindowIds.add(tab.getWindow().id);
        this.emitContentChange(tab.getWindow().id, tab.id);
      }
    }

    if (convertedTab && !pinnedTab.hasAssociation(convertedTab.id)) {
      affectedWindowIds.add(convertedTab.getWindow().id);
    }

    this.pinnedTabs.delete(pinnedTabId);
    this.pinnedTabDb.delete(pinnedTabId);
    pinnedTab.destroy();

    this.emit("pinned-tab-changed");

    // Emit structural change for all affected windows
    for (const windowId of affectedWindowIds) {
      this.emitStructuralChange(windowId);
    }

    return true;
  }

  /**
   * Reorder a pinned tab.
   */
  public reorderPinnedTab(pinnedTabId: string, newPosition: number): void {
    const pinnedTab = this.pinnedTabs.get(pinnedTabId);
    if (!pinnedTab) return;

    pinnedTab.updatePosition(newPosition);
    this.normalizePinnedTabPositions(pinnedTab.profileId);
    this.emit("pinned-tab-changed");
  }

  /**
   * Get pinned tabs for a profile, sorted by position.
   */
  public getPinnedTabsForProfile(profileId: string): PinnedTab[] {
    const result: PinnedTab[] = [];
    for (const pt of this.pinnedTabs.values()) {
      if (pt.profileId === profileId) result.push(pt);
    }
    return result.sort((a, b) => a.position - b.position);
  }

  /**
   * Get all pinned tabs grouped by profile.
   */
  public getAllPinnedTabsByProfile(): Record<string, PinnedTab[]> {
    const result: Record<string, PinnedTab[]> = {};
    for (const pt of this.pinnedTabs.values()) {
      if (!result[pt.profileId]) result[pt.profileId] = [];
      result[pt.profileId].push(pt);
    }
    for (const profileId of Object.keys(result)) {
      result[profileId].sort((a, b) => a.position - b.position);
    }
    return result;
  }

  /**
   * Get a pinned tab by its associated tab ID (reverse lookup).
   */
  public getPinnedTabByAssociatedTabId(tabId: number): PinnedTab | undefined {
    for (const pt of this.pinnedTabs.values()) {
      if (pt.hasAssociation(tabId)) return pt;
    }
    return undefined;
  }

  // --- Tab Movement ---

  /**
   * Move a tab to a new position.
   */
  public moveTab(tabId: number, newPosition: number): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    const windowId = tab.getWindow().id;
    const spaceId = tab.spaceId;
    const layout = this.getLayout(windowId, spaceId);
    const needsLayoutRefresh = layout?.getNodes().some((node) => node.mode !== "single") ?? false;

    const positionChanged = tab.updateStateProperty("position", newPosition);
    this.positioner.normalizePositions(this.getTabsInWindowSpace(windowId, spaceId));

    if (positionChanged && needsLayoutRefresh) {
      this.emitStructuralChange(windowId);
    }

    // Notify extensions that indices shifted after reorder
    this.notifyIndexChanges(windowId, tab.profileId);
  }

  /**
   * Normalize tab positions in a window-space (assigns sequential integers).
   */
  public normalizePositions(windowId: number, spaceId: string): void {
    this.positioner.normalizePositions(this.getTabsInWindowSpace(windowId, spaceId));
  }

  /**
   * Move a tab to a different space.
   */
  public moveTabToSpace(tabId: number, spaceId: string, newPosition?: number): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    const sourceSpaceId = tab.spaceId;
    if (sourceSpaceId === spaceId) return;

    const windowId = tab.getWindow().id;
    const sourceLayout = this.getLayout(windowId, sourceSpaceId);
    const targetLayout = this.getOrCreateLayout(windowId, spaceId);

    // Hide the tab before moving (it's leaving the source space)
    if (tab.visible) {
      tab.visible = false;
      tab.layer?.setVisible(false);
    }

    // Remove from source layout
    if (sourceLayout) {
      const node = sourceLayout.getNodeForTab(tab.id);
      if (node) {
        // Destroy single node from source, or remove tab from multi-node.
        // The "destroyed" event cascades cleanup to all member layouts.
        if (node.mode === "single") {
          sourceLayout.destroyNode(node.id);
        } else {
          node.removeTab(tab);
        }
      }
    }

    // Update tab's space
    tab.setSpace(spaceId);

    // Create a new node in the target layout
    targetLayout.createSingleNode(tab);

    // Clear focused tab references to this tab in the source space across ALL layouts.
    for (const layout of this.layouts.values()) {
      if (layout.spaceId === sourceSpaceId && layout.getFocusedTab()?.id === tab.id) {
        layout.removeFocusedTab();
      }
    }

    if (newPosition !== undefined) {
      tab.updateStateProperty("position", newPosition);
    }

    // Normalize both spaces
    this.positioner.normalizePositions(this.getTabsInWindowSpace(windowId, spaceId));
    this.positioner.normalizePositions(this.getTabsInWindowSpace(windowId, sourceSpaceId));

    // Notify extensions that indices shifted (tab moved between spaces)
    this.notifyIndexChanges(windowId, tab.profileId);

    // Notify renderer that source space changed (tab removed)
    this.emitStructuralChange(windowId);
  }

  /**
   * Set muted state for a tab.
   */
  public setTabMuted(tabId: number, muted: boolean): boolean {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;

    tab.webContents?.setAudioMuted(muted);
    tab.updateTabState();
    return true;
  }

  // --- Layout Management ---

  private layoutKey(windowId: number, spaceId: string): string {
    return `${windowId}-${spaceId}`;
  }

  /**
   * Get a layout for a specific window-space.
   */
  public getLayout(windowId: number, spaceId: string): TabLayout | undefined {
    return this.layouts.get(this.layoutKey(windowId, spaceId));
  }

  /**
   * Get all layouts for a given window.
   */
  public getLayoutsForWindow(windowId: number): TabLayout[] {
    const result: TabLayout[] = [];
    for (const layout of this.layouts.values()) {
      if (layout.windowId === windowId) result.push(layout);
    }
    return result;
  }

  /**
   * Get the currently visible layout for a window (matching current space).
   */
  public getVisibleLayout(windowId: number): TabLayout | undefined {
    const window = browserWindowsController.getWindowById(windowId);
    if (!window?.currentSpaceId) return undefined;
    return this.getLayout(windowId, window.currentSpaceId);
  }

  public getOrCreateLayout(windowId: number, spaceId: string): TabLayout {
    const key = this.layoutKey(windowId, spaceId);
    let layout = this.layouts.get(key);
    if (!layout) {
      layout = new TabLayout(windowId, spaceId, this.positioner);
      this.layouts.set(key, layout);

      // Set visibility based on whether this space is currently active
      const window = browserWindowsController.getWindowById(windowId);
      if (window && window.currentSpaceId === spaceId) {
        layout.setVisible(true);
      }

      // Forward events
      const newLayout = layout;
      newLayout.on("active-changed", (wId, sId) => {
        if (newLayout.visible) {
          this.updateTabVisibility(wId, sId);
        }
        this.emit("active-changed", wId, sId);
      });
      newLayout.on("focused-tab-changed", (wId, sId) => {
        this.emit("focused-tab-changed", wId, sId);
      });

      // Exit tab fullscreen when OS window exits fullscreen (register once per window)
      this.ensureWindowFullscreenListener(windowId);

      // Register any existing pinned tab nodes from this profile into the new layout.
      const spaceData = spacesController.getFromCache(spaceId);
      if (spaceData) {
        for (const pinnedTab of this.pinnedTabs.values()) {
          if (pinnedTab.profileId !== spaceData.profileId) continue;
          const node = pinnedTab.layoutNode;
          if (node && !node.isDestroyed && !layout.getNode(node.id)) {
            layout.addExistingNode(node);
          }
        }
      }
    }
    return layout;
  }

  private _windowFullscreenListeners: Set<number> = new Set();

  private ensureWindowFullscreenListener(windowId: number): void {
    if (this._windowFullscreenListeners.has(windowId)) return;
    this._windowFullscreenListeners.add(windowId);

    const window = browserWindowsController.getWindowById(windowId);
    if (window) {
      window.on("leave-full-screen", () => {
        const currentSpaceId = window.currentSpaceId;
        if (!currentSpaceId) return;
        for (const tab of this.getTabsInWindowSpace(windowId, currentSpaceId)) {
          if (tab.fullScreen) {
            tab.setFullScreen(false);
          }
        }
      });
    }
  }

  public removeLayout(windowId: number, spaceId: string): void {
    const key = this.layoutKey(windowId, spaceId);
    const layout = this.layouts.get(key);
    if (layout) {
      layout.destroy();
      this.layouts.delete(key);
    }
  }

  /**
   * Remove all layouts for a window (on window close).
   */
  public removeAllLayoutsForWindow(windowId: number): void {
    for (const [key, layout] of this.layouts) {
      if (layout.windowId === windowId) {
        layout.destroy();
        this.layouts.delete(key);
      }
    }
    this._windowFullscreenListeners.delete(windowId);
  }

  // --- Tab Visibility ---

  /**
   * Update tab visibility for a given window+space.
   * Tabs in the active node are shown; all others in that space are hidden.
   */
  private updateTabVisibility(windowId: number, spaceId: string): void {
    const layout = this.getLayout(windowId, spaceId);
    if (!layout) return;
    if (!layout.visible) return;

    const activeNode = layout.getActiveNode();

    // Collect all tabs that belong to this layout's scope:
    // - Normal tabs in this window+space
    // - Tabs in the active node (includes pinned tabs whose spaceId may differ)
    const tabsInSpace = this.getTabsInWindowSpace(windowId, spaceId);
    const allRelevantTabs = new Set(tabsInSpace);
    if (activeNode) {
      for (const tab of activeNode.tabs) {
        allRelevantTabs.add(tab);
      }
    }

    for (const tab of allRelevantTabs) {
      const shouldBeVisible = activeNode !== null && activeNode.hasTab(tab.id);
      if (tab.visible !== shouldBeVisible) {
        const wasVisible = tab.visible;

        // When a tab is being hidden, record the time so archive/sleep timers
        // measure from when the user actually stopped viewing it.
        if (!shouldBeVisible) {
          tab.lastActiveAt = Math.floor(Date.now() / 1000);
          if (tab.fullScreen) {
            tab.setFullScreen(false);
          }
        }
        tab.visible = shouldBeVisible;
        tab.layer?.setVisible(shouldBeVisible);

        // PiP transitions on visibility change
        if (wasVisible && !shouldBeVisible && tab.layer) {
          // Tab became hidden — auto-enter PiP if playing video
          const isStillVisibleElsewhere = this.isTabVisibleInAnotherWindow(tab);
          if (this._pipCount === 0 && !isStillVisibleElsewhere) {
            tab.enterPictureInPicture();
          }
        } else if (!wasVisible && shouldBeVisible && tab.isPictureInPicture) {
          // Tab became visible — exit PiP
          tab.exitPictureInPicture();
        }
      }
    }
  }

  /**
   * Returns true when the tab is visible (active) in a different browser window.
   * Used to prevent auto-PiP for tabs that are still on-screen elsewhere (STAW).
   */
  private isTabVisibleInAnotherWindow(tab: Tab): boolean {
    const tabWindowId = tab.getWindow().id;
    for (const layout of this.layouts.values()) {
      if (layout.windowId === tabWindowId) continue;
      if (!layout.visible) continue;
      const window = browserWindowsController.getWindowById(layout.windowId);
      if (!window || window.destroyed || window.browserWindowType !== "normal") continue;
      const activeNode = layout.getActiveNode();
      if (activeNode && activeNode.hasTab(tab.id)) return true;
    }
    return false;
  }

  // --- Window Space Management ---

  public setCurrentWindowSpace(windowId: number, spaceId: string, oldSpaceId?: string | null): void {
    const window = browserWindowsController.getWindowById(windowId);
    if (!window) return;

    // Toggle layout visibility: hide old space layout, show new space layout
    if (oldSpaceId && oldSpaceId !== spaceId) {
      const oldLayout = this.getLayout(windowId, oldSpaceId);
      if (oldLayout) {
        oldLayout.setVisible(false);
        // Hide all visible tabs in old layout.
        // Include active node tabs (pinned tabs may have a different spaceId).
        const tabsToHide = new Set(this.getTabsInWindowSpace(windowId, oldSpaceId));
        const oldActiveNode = oldLayout.getActiveNode();
        if (oldActiveNode) {
          for (const tab of oldActiveNode.tabs) {
            tabsToHide.add(tab);
          }
        }
        for (const tab of tabsToHide) {
          if (tab.visible) {
            tab.lastActiveAt = Math.floor(Date.now() / 1000);
            if (tab.fullScreen) {
              tab.setFullScreen(false);
            }
            tab.visible = false;
            tab.layer?.setVisible(false);

            // Auto-PiP for hidden tabs with playing video
            if (tab.layer) {
              if (this._pipCount === 0 && !this.isTabVisibleInAnotherWindow(tab)) {
                tab.enterPictureInPicture();
              }
            }
          }
        }
      }
    }

    // Pinned tabs are NOT auto-relocated on space switch. They only move
    // when the user explicitly activates them (via clickPinnedTab).

    const layout = this.getLayout(windowId, spaceId);

    // If no active node is set yet (e.g. tabs were restored asleep), optionally
    // activate the focused tab or the most recently active one.
    if (FLAGS.ACTIVATE_TAB_ON_SPACE_SWITCH && layout && !layout.getActiveNode()) {
      const focused = layout.getFocusedTab();
      if (focused && !focused.isDestroyed) {
        this.activateTab(focused);
        return;
      }
      // Fall back to the most recently active tab in this space
      const tabsInSpace = this.getTabsInWindowSpace(windowId, spaceId);
      if (tabsInSpace.length > 0) {
        const sorted = tabsInSpace.sort((a, b) => b.lastActiveAt - a.lastActiveAt);
        this.activateTab(sorted[0]);
        return;
      }
    }

    // Mark new layout as visible
    if (layout) {
      layout.setVisible(true);
    }

    this.updateTabVisibility(windowId, spaceId);
    this.handlePageBoundsChanged(windowId);
    this.emitStructuralChange(windowId);
  }

  public handlePageBoundsChanged(windowId: number): void {
    // Delegate bounds calculation to each layout (which delegates to its active node)
    for (const layout of this.getLayoutsForWindow(windowId)) {
      layout.applyBounds();
    }
  }

  // --- Event Helpers ---

  public emitStructuralChange(windowId: number): void {
    if (quitController.isQuitting) return;
    if (this._suppressEmissions > 0) {
      this._deferredStructural.add(windowId);
      return;
    }
    this.emit("structural-change", windowId);
  }

  public emitContentChange(windowId: number, tabId: number): void {
    if (quitController.isQuitting) return;
    if (this._suppressEmissions > 0) {
      // Structural change will include content anyway
      this._deferredStructural.add(windowId);
      return;
    }
    this.emit("content-change", windowId, tabId);
  }

  /**
   * Notify all tabs in a window+profile that their index may have changed.
   * Called after structural changes (tab create/destroy/move/reorder).
   */
  private notifyIndexChanges(windowId: number, profileId: string): void {
    for (const tab of this.getTabsInWindowProfile(windowId, profileId)) {
      tab.notifyExtensionsOfChanges();
    }
  }

  /**
   * Suppress emissions during batch operations. Call endBatch() when done
   * to flush a single structural change for each affected window.
   */
  public beginBatch(): void {
    this._suppressEmissions++;
  }

  public endBatch(): void {
    this._suppressEmissions--;
    if (this._suppressEmissions <= 0) {
      this._suppressEmissions = 0;
      for (const windowId of this._deferredStructural) {
        this.emit("structural-change", windowId);
      }
      this._deferredStructural.clear();
    }
  }

  // --- Private Methods ---

  private wireTabEvents(tab: Tab): void {
    tab.on("updated", (props) => {
      if (quitController.isQuitting) return;
      // Track PiP counter for O(1) "any tab in PiP" checks
      if (props.includes("isPictureInPicture")) {
        this._pipCount += tab.isPictureInPicture ? 1 : -1;
      }
      // Update webContents index when tab wakes up (new webContents created).
      // Old keys are GC'd automatically since webContentsIndex is a WeakMap.
      if (props.includes("asleep") && !tab.asleep && tab.webContents) {
        this.webContentsIndex.set(tab.webContents, tab);
      }
      // Notify extension system of tab state changes (title, url, muted, etc.)
      tab.notifyExtensionsOfChanges();
      this.emitContentChange(tab.getWindow().id, tab.id);
    });

    tab.on("content-changed", () => {
      if (quitController.isQuitting) return;
      this.emitContentChange(tab.getWindow().id, tab.id);
    });

    tab.on("space-changed", (oldSpaceId) => {
      if (quitController.isQuitting) return;
      // Update space index
      this.removeFromIndex(this.spaceIndex, oldSpaceId, tab);
      this.addToIndex(this.spaceIndex, tab.spaceId, tab);

      // Content change invalidates the serialization cache (spaceId changed)
      this.emitContentChange(tab.getWindow().id, tab.id);
      this.emitStructuralChange(tab.getWindow().id);
    });

    tab.on("window-changed", (oldWindowId) => {
      if (quitController.isQuitting) return;
      // Update window index
      this.removeFromIndex(this.windowIndex, oldWindowId, tab);
      this.addToIndex(this.windowIndex, tab.getWindow().id, tab);

      this.emitStructuralChange(tab.getWindow().id);
      if (oldWindowId !== tab.getWindow().id) {
        this.emitStructuralChange(oldWindowId);
        // Index shifted in both old and new window
        this.notifyIndexChanges(oldWindowId, tab.profileId);
      }
      this.notifyIndexChanges(tab.getWindow().id, tab.profileId);
      // Re-serialize so persistence picks up the new windowGroupId
      this.emitContentChange(tab.getWindow().id, tab.id);
    });

    tab.on("focused", () => {
      const window = tab.getWindow();
      const spaceId = window.currentSpaceId ?? tab.spaceId;
      const currentLayout = this.getLayout(window.id, spaceId);
      if (currentLayout && this.isTabActive(tab)) {
        currentLayout.setFocusedTab(tab);
      }
    });

    tab.on("fullscreen-changed", () => {
      if (quitController.isQuitting) return;
      this.handlePageBoundsChanged(tab.getWindow().id);
    });

    tab.on("target-url-changed", (url) => {
      if (quitController.isQuitting) return;
      const window = tab.getWindow();
      if (window.destroyed) return;
      window.sendMessageToCoreWebContents("tab-service:on-target-url", {
        tabId: tab.id,
        windowId: window.id,
        url
      });
    });

    tab.on("new-tab-requested", (url, disposition, constructorOptions, handlerDetails, options) => {
      this.handleNewTabRequested(tab, url, disposition, constructorOptions, handlerDetails, options);
    });

    tab.on("destroyed", () => {
      // Always clean up indexes
      this.removeFromIndex(this.windowIndex, tab.getWindow().id, tab);
      this.removeFromIndex(this.spaceIndex, tab.spaceId, tab);

      // Decrement PiP counter if the tab was in PiP when destroyed
      if (tab.isPictureInPicture) {
        this._pipCount--;
      }

      if (quitController.isQuitting) {
        this.tabs.delete(tab.id);
        return;
      }

      const windowId = tab.getWindow().id;
      const position = tab.position;

      // Find the layout containing this tab. Prefer window's current space
      // (handles pinned tabs whose spaceId differs from active space).
      const win = browserWindowsController.getWindowById(windowId);
      const currentSpaceId = win?.currentSpaceId;
      let currentLayout = currentSpaceId ? this.getLayout(windowId, currentSpaceId) : undefined;
      if (!currentLayout?.getNodeForTab(tab.id)) {
        currentLayout = this.getLayout(windowId, tab.spaceId);
      }

      // Determine if tab was active. The once("destroyed") listener from
      // TabLayoutNode.addTab fires before this handler (registered earlier),
      // so it may have already removed the tab → emptied the node →
      // auto-destroyed the node → layout set activeNode = null.
      // If activeNode is null, it means the active node was just destroyed
      // (the only path that nulls activeNode during a tab destroy), so the
      // tab was active.
      let wasActive = false;
      if (currentLayout) {
        const activeNode = currentLayout.getActiveNode();
        if (activeNode) {
          wasActive = activeNode.hasTab(tab.id);
        } else {
          // Active node was just destroyed — this tab was its last occupant
          wasActive = true;
        }
      }

      // Store in recently closed (only normal tabs with URLs)
      if (tab.owner.kind === "normal" && tab.url) {
        this.recentlyClosed.add(this.serializeTabForPersistence(tab));
      }

      // Clean up pinned tab association and layout node reference
      const pinnedTab = this.getPinnedTabByAssociatedTabId(tab.id);
      if (pinnedTab) {
        pinnedTab.dissociateByTabId(tab.id);
        pinnedTab.layoutNode = null;
      }

      // Remove from layout node (may already be removed by once listener)
      if (currentLayout) {
        const node = currentLayout.getNodeForTab(tab.id);
        if (node) {
          node.removeTab(tab);
        }
      }

      // Remove from tracking
      this.tabs.delete(tab.id);
      this.emit("tab-removed", tab);

      // Handle active tab selection
      if (wasActive && currentLayout) {
        currentLayout.removeActiveAndSelectNext(position);
      }

      this.emitStructuralChange(windowId);

      // Notify extensions that indices shifted for remaining tabs in same profile
      this.notifyIndexChanges(windowId, tab.profileId);

      // Auto-close empty popup windows
      this.reconcilePopupWindow(windowId);
    });
  }

  /**
   * If a popup window has no tabs left, close it. Otherwise, activate
   * the best remaining tab.
   */
  private reconcilePopupWindow(windowId: number): void {
    if (quitController.isQuitting) return;
    const window = browserWindowsController.getWindowById(windowId);
    if (!window || window.destroyed || window.browserWindowType !== "popup") return;

    const tabsInWindow = this.getTabsInWindow(windowId);
    if (tabsInWindow.length === 0) {
      setImmediate(() => {
        const latestWindow = browserWindowsController.getWindowById(windowId);
        if (!latestWindow || latestWindow.destroyed || latestWindow.browserWindowType !== "popup") return;
        if (this.getTabsInWindow(windowId).length > 0) return;
        latestWindow.close();
      });
      return;
    }

    // If there's no active tab, activate the most recently active one
    const currentSpaceId = window.currentSpaceId;
    if (!currentSpaceId) return;
    const layout = this.getLayout(windowId, currentSpaceId);
    if (!layout) return;
    const activeNode = layout.getActiveNode();
    if (activeNode) return;

    // Find the best tab to activate
    const spaceTabs = tabsInWindow
      .filter((t) => t.spaceId === currentSpaceId)
      .sort((a, b) => b.lastActiveAt - a.lastActiveAt);
    const bestTab = spaceTabs[0] ?? tabsInWindow.sort((a, b) => b.lastActiveAt - a.lastActiveAt)[0];
    if (bestTab) {
      this.activateTab(bestTab);
    }
  }

  private handleNewTabRequested(
    sourceTab: Tab,
    url: string,
    disposition: "new-window" | "foreground-tab" | "background-tab" | "default" | "other",
    constructorOptions: Electron.WebContentsViewConstructorOptions | undefined,
    handlerDetails: Electron.HandlerDetails | undefined,
    options: { noLoadURL?: boolean }
  ): void {
    let targetWindow = sourceTab.getWindow();
    let windowId = targetWindow.id;
    let targetSpaceId = targetWindow.currentSpaceId ?? sourceTab.spaceId;

    if (disposition === "new-window") {
      const parsedFeatures: Record<string, string | number> = {};
      if (handlerDetails?.features) {
        for (const feature of handlerDetails.features.split(",")) {
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
      popupWindow.setCurrentSpace(targetSpaceId);
      targetWindow = popupWindow;
      windowId = popupWindow.id;
    } else {
      targetSpaceId = targetWindow.currentSpaceId ?? sourceTab.spaceId;
    }

    const insertPosition = disposition !== "new-window" ? sourceTab.position + 0.5 : undefined;

    const isBackground = disposition === "background-tab";
    const newTab = this.createTabInternal(windowId, sourceTab.profileId, targetSpaceId, undefined, {
      url,
      noLoadURL: options.noLoadURL,
      webContentsViewOptions: constructorOptions,
      position: insertPosition,
      makeActive: !isBackground
    });

    if (insertPosition !== undefined) {
      this.positioner.normalizePositions(this.getTabsInWindowSpace(targetWindow.id, targetSpaceId));
    }

    sourceTab._lastCreatedWebContents = newTab.webContents;
  }

  private wirePinnedTabEvents(pinnedTab: PinnedTab): void {
    pinnedTab.on("association-changed", () => {
      this.emit("pinned-tab-changed");
    });
    pinnedTab.on("updated", () => {
      this.pinnedTabDb.save(pinnedTab);
      this.emit("pinned-tab-changed");
    });
  }

  private getMaxPinnedTabPosition(profileId: string): number {
    let max = -1;
    for (const pt of this.pinnedTabs.values()) {
      if (pt.profileId === profileId && pt.position > max) {
        max = pt.position;
      }
    }
    return max;
  }

  private normalizePinnedTabPositions(profileId: string): void {
    const sorted = this.getPinnedTabsForProfile(profileId);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].position !== i) {
        sorted[i].updatePosition(i);
      }
    }
  }

  /**
   * Reorder pinned-tab-owned nodes in a layout so their positions match the
   * pinned tab grid order. Uses the layout's nodes directly (not
   * getTabsInWindowSpace) because pinned tab views may be in a different
   * window while their nodes remain propagated in this layout.
   */
  private reorderPinnedTabsInSpace(windowId: number, spaceId: string): void {
    const layout = this.getLayout(windowId, spaceId);
    if (!layout) return;

    const pinnedNodes: { node: TabLayoutNode; pinnedPosition: number }[] = [];
    const normalNodes: TabLayoutNode[] = [];

    for (const node of layout.getNodes()) {
      const frontTab = node.frontTab;
      if (!frontTab) continue;
      if (frontTab.owner.kind === "pinned") {
        const pinnedTab = this.pinnedTabs.get(frontTab.owner.pinnedTabId);
        pinnedNodes.push({ node, pinnedPosition: pinnedTab?.position ?? 0 });
      } else {
        normalNodes.push(node);
      }
    }

    if (pinnedNodes.length === 0) return;

    // Sort pinned nodes by their pinned tab's grid position
    pinnedNodes.sort((a, b) => a.pinnedPosition - b.pinnedPosition);

    // Assign positions: pinned nodes first (in order), then normal nodes
    let pos = 0;
    for (const { node } of pinnedNodes) {
      const tab = node.frontTab!;
      if (tab.position !== pos) {
        tab.updateStateProperty("position", pos);
      }
      pos++;
    }

    normalNodes.sort((a, b) => a.position - b.position);
    for (const node of normalNodes) {
      const tab = node.frontTab!;
      if (tab.position !== pos) {
        tab.updateStateProperty("position", pos);
      }
      pos++;
    }
  }

  // --- Picture in Picture ---

  public disablePictureInPicture(tabId: number, goBackToTab: boolean): boolean {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.isPictureInPicture) return false;

    tab.updateStateProperty("isPictureInPicture", false);

    if (goBackToTab) {
      const win = tab.getWindow();
      setWindowSpace(win, tab.spaceId);
      win.browserWindow.focus();
      this.activateTab(tab);
    }

    return true;
  }

  // --- Batch Tab Move ---

  public batchMoveTabs(tabIds: number[], spaceId: string, window: BrowserWindow, newPositionStart?: number): boolean {
    const affectedSourceSpaces = new Set<string>();

    for (let i = 0; i < tabIds.length; i++) {
      const tab = this.tabs.get(tabIds[i]);
      if (!tab) continue;

      const sourceSpaceId = tab.spaceId;
      const sourceWindowId = tab.getWindow().id;
      const leavingSourceLayout = sourceSpaceId !== spaceId || sourceWindowId !== window.id;

      // Hide only if actually leaving the current window-space
      if (leavingSourceLayout && tab.visible) {
        tab.visible = false;
        tab.layer?.setVisible(false);
      }

      // Remove from source layout node
      if (leavingSourceLayout) {
        const sourceLayout = this.getLayout(sourceWindowId, sourceSpaceId);
        if (sourceLayout) {
          const node = sourceLayout.getNodeForTab(tab.id);
          if (node && node.mode === "single") {
            sourceLayout.destroyNode(node.id);
          } else if (node) {
            node.removeTab(tab);
          }
        }
        affectedSourceSpaces.add(`${sourceWindowId}-${sourceSpaceId}`);
      }

      tab.setSpace(spaceId);
      tab.setWindow(window);

      // Create node in target layout
      const targetLayout = this.getOrCreateLayout(window.id, spaceId);
      if (!targetLayout.getNodeForTab(tab.id)) {
        targetLayout.createSingleNode(tab);
      }

      if (newPositionStart !== undefined) {
        tab.updateStateProperty("position", newPositionStart + i);
      }
    }

    this.positioner.normalizePositions(this.getTabsInWindowSpace(window.id, spaceId));

    // Emit structural changes for affected source windows
    for (const key of affectedSourceSpaces) {
      const [windowIdStr] = key.split("-");
      const windowId = parseInt(windowIdStr, 10);
      this.emitStructuralChange(windowId);
    }
    this.emitStructuralChange(window.id);

    // Notify extensions of index changes for all moved tabs' profiles
    const profileIds = new Set<string>();
    for (const tabId of tabIds) {
      const tab = this.tabs.get(tabId);
      if (tab) profileIds.add(tab.profileId);
    }
    for (const profileId of profileIds) {
      this.notifyIndexChanges(window.id, profileId);
    }

    return true;
  }

  // --- Recently Closed ---

  public getRecentlyClosed(): RecentlyClosedTabData[] {
    return this.recentlyClosed.getAll();
  }

  public async restoreRecentlyClosed(uniqueId: string, window: BrowserWindow): Promise<boolean> {
    const result = this.recentlyClosed.restore(uniqueId);
    if (!result) return false;

    const { tabData } = result;
    const space = await spacesController.get(tabData.spaceId);
    if (!space) return false;

    const tab = await this.createTab(window.id, space.profileId, tabData.spaceId, undefined, {
      uniqueId: tabData.uniqueId,
      createdAt: tabData.createdAt,
      lastActiveAt: tabData.lastActiveAt,
      position: tabData.position,
      title: tabData.title,
      faviconURL: tabData.faviconURL ?? undefined,
      navHistory: tabData.navHistory,
      navHistoryIndex: tabData.navHistoryIndex
    });

    this.activateTab(tab);
    return true;
  }

  public clearRecentlyClosed(): void {
    this.recentlyClosed.clear();
  }

  // --- Context Menus ---

  public showContextMenu(tabId: number, window: BrowserWindow): void {
    void showTabContextMenu(this, tabId, window);
  }

  public showPinnedTabContextMenu(pinnedTabId: string, window: BrowserWindow): void {
    void showPinnedTabContextMenu(this, pinnedTabId, window);
  }

  // --- Serialization ---

  private serializeTabForPersistence(tab: Tab): PersistedTabData {
    const navHistory: NavigationEntry[] = [];
    let navHistoryIndex = 0;

    if (tab.webContents && !tab.webContents.isDestroyed()) {
      const history = tab.webContents.navigationHistory;
      const count = history.length();
      for (let i = 0; i < count; i++) {
        const entry = history.getEntryAtIndex(i);
        navHistory.push({ title: entry.title || "", url: entry.url, pageState: entry.pageState });
      }
      navHistoryIndex = history.getActiveIndex();
    } else if (tab.navHistory.length > 0) {
      navHistory.push(...tab.navHistory);
      navHistoryIndex = tab.navHistoryIndex;
    } else if (tab.url) {
      navHistory.push({ title: tab.title, url: tab.url });
      navHistoryIndex = 0;
    }

    return {
      schemaVersion: TAB_SERVICE_SCHEMA_VERSION,
      uniqueId: tab.uniqueId,
      createdAt: tab.createdAt,
      lastActiveAt: tab.lastActiveAt,
      position: tab.position,
      profileId: tab.profileId,
      spaceId: tab.spaceId,
      windowGroupId: `w-${tab.getWindow().id}`,
      title: tab.title,
      url: tab.url,
      faviconURL: tab.faviconURL,
      muted: tab.muted,
      navHistory,
      navHistoryIndex,
      owner: tab.owner
    };
  }

  // --- Index Helpers ---

  private addToIndex<K>(index: Map<K, Set<Tab>>, key: K, tab: Tab): void {
    let set = index.get(key);
    if (!set) {
      set = new Set();
      index.set(key, set);
    }
    set.add(tab);
  }

  private removeFromIndex<K>(index: Map<K, Set<Tab>>, key: K, tab: Tab): void {
    const set = index.get(key);
    if (set) {
      set.delete(tab);
      if (set.size === 0) index.delete(key);
    }
  }
}
