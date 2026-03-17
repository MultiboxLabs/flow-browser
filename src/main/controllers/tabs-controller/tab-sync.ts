/**
 * Tab Sync — shared tab state across windows.
 *
 * When enabled, every window sees the same tabs. When a window gains focus,
 * the active tab's WebContentsView is moved there. A screenshot placeholder
 * is left in the old window. Disabled by default (each window has independent tabs).
 */

import { getSettingValueById } from "@/saving/settings";
import { windowsController } from "@/controllers/windows-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import type { BrowserWindow } from "@/controllers/windows-controller/types";
import { spacesController } from "@/controllers/spaces-controller";
import { pinnedTabsController } from "@/controllers/pinned-tabs-controller";
import {
  storeSnapshot,
  removeSnapshot
} from "@/controllers/sessions-controller/protocols/_protocols/flow-internal/tab-snapshot";
import type { TabPlaceholderUpdate } from "~/types/tabs";
import { Tab } from "./tab";
import { BaseTabGroup } from "./tab-groups";
import { type TabsController } from "./index";

// TabsController registration (avoids circular dependency)

let _tabsController: TabsController | null = null;

/** Called from TabsController constructor to avoid circular imports. */
export function registerTabsController(tc: TabsController): void {
  _tabsController = tc;
}

function getTabsController(): TabsController {
  if (!_tabsController) {
    throw new Error("[tab-sync] TabsController not registered yet. Call registerTabsController() first.");
  }
  return _tabsController;
}

// Screenshot placeholders (served via flow-internal://tab-snapshot)
const PLACEHOLDER_RELEASE_DELAY_MS = 180;

type WindowPlaceholderState = {
  snapshotId: string;
  tabId: number;
  generation: number;
  spaceId: string;
};

/** Current placeholder state per window, for cleanup. */
const windowPlaceholderState: Map<number, WindowPlaceholderState> = new Map();
const windowPlaceholderGeneration: Map<number, number> = new Map();

function nextPlaceholderGeneration(windowId: number): number {
  const generation = (windowPlaceholderGeneration.get(windowId) ?? 0) + 1;
  windowPlaceholderGeneration.set(windowId, generation);
  return generation;
}

function sendPlaceholderUpdate(targetWindow: BrowserWindow, update: TabPlaceholderUpdate): void {
  if (targetWindow.destroyed) return;
  targetWindow.sendMessageToCoreWebContents("tabs:on-placeholder-changed", update);
}

/**
 * Captures a screenshot of the tab. Must be called while the view is still
 * attached — capturePage returns empty once the view is detached.
 */
async function captureTabScreenshot(tab: Tab): Promise<Electron.NativeImage | null> {
  const wc = tab.webContents;
  if (!wc || wc.isDestroyed()) return null;

  const view = tab.view;
  if (!view) return null;

  const bounds = view.getBounds();
  if (bounds.width <= 0 || bounds.height <= 0) return null;

  try {
    const image = await wc.capturePage({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    return image.isEmpty() ? null : image;
  } catch {
    return null;
  }
}

/** Stores a snapshot and sends its ID to the target window's renderer. */
function sendPlaceholderToRenderer(
  targetWindow: BrowserWindow,
  spaceId: string,
  tabId: number,
  image: Electron.NativeImage
): void {
  if (targetWindow.destroyed) return;

  const previousPlaceholder = windowPlaceholderState.get(targetWindow.id);
  if (previousPlaceholder) {
    removeSnapshot(previousPlaceholder.snapshotId);
  }

  const generation = nextPlaceholderGeneration(targetWindow.id);
  const snapshotId = storeSnapshot(image);
  windowPlaceholderState.set(targetWindow.id, { snapshotId, tabId, generation, spaceId });
  sendPlaceholderUpdate(targetWindow, { snapshotId, generation, spaceId });
}

/** Clears the placeholder in a window and frees the stored snapshot. */
function clearPlaceholderInRenderer(windowId: number): void {
  const generation = nextPlaceholderGeneration(windowId);
  const placeholderState = windowPlaceholderState.get(windowId);
  if (placeholderState) {
    windowPlaceholderState.delete(windowId);
    setTimeout(() => {
      removeSnapshot(placeholderState.snapshotId);
    }, PLACEHOLDER_RELEASE_DELAY_MS);
  }

  const win = browserWindowsController.getWindowById(windowId);
  if (!win) return;

  sendPlaceholderUpdate(win, { snapshotId: null, generation, spaceId: win.currentSpaceId });
}

/** Clears any placeholders currently showing a screenshot for the destroyed tab. */
export function clearPlaceholdersForTab(tabId: number): void {
  for (const [windowId, placeholderState] of windowPlaceholderState.entries()) {
    if (placeholderState.tabId !== tabId) continue;
    clearPlaceholderInRenderer(windowId);
  }
}

/**
 * Clears a window's placeholder when its currently visible space no longer
 * points at any remote syncable tab. Placeholders are window-wide in the
 * renderer, so without this reconciliation a screenshot from Space A can
 * linger after switching the window to Space B.
 */
function reconcilePlaceholderForWindow(windowId: number): void {
  const tabsController = getTabsController();
  const window = browserWindowsController.getWindowById(windowId);
  if (!window || window.destroyed || window.browserWindowType !== "normal") return;

  const spaceId = window.currentSpaceId;
  if (!spaceId) {
    clearPlaceholderInRenderer(windowId);
    return;
  }

  const activeTabOrGroup = tabsController.getActiveTab(windowId, spaceId);
  if (!activeTabOrGroup) {
    clearPlaceholderInRenderer(windowId);
    return;
  }

  const syncableTabs =
    activeTabOrGroup instanceof Tab
      ? isSyncExcludedTab(activeTabOrGroup)
        ? []
        : [activeTabOrGroup]
      : activeTabOrGroup.tabs.filter((tab) => !isSyncExcludedTab(tab));

  if (syncableTabs.length === 0) {
    clearPlaceholderInRenderer(windowId);
    return;
  }

  const hasRemoteActiveTab = syncableTabs.some((tab) => tab.getWindow().id !== windowId);
  if (!hasRemoteActiveTab) {
    clearPlaceholderInRenderer(windowId);
  }
}

// Core helpers

export function isTabSyncEnabled(): boolean {
  return getSettingValueById("syncTabsAcrossWindows") === true;
}

/** Returns true if the tab belongs to an internal profile (e.g. incognito). */
export function isInternalProfileTab(tab: Tab): boolean {
  return tab.loadedProfile.profileData.internal === true;
}

/** Returns true if the tab currently belongs to a popup window. */
export function isPopupWindowTab(tab: Tab): boolean {
  return tab.getWindow().browserWindowType === "popup";
}

/** Returns true if the tab should be excluded from tab sync (internal or popup). */
export function isSyncExcludedTab(tab: Tab): boolean {
  return isInternalProfileTab(tab) || isPopupWindowTab(tab);
}

function shouldSyncSharedActiveTab(window: BrowserWindow, spaceId: string): boolean {
  if (isTabSyncEnabled()) return true;

  const tabsController = getTabsController();
  const activeTabOrGroup = tabsController.getActiveTab(window.id, spaceId);
  return activeTabOrGroup instanceof Tab && pinnedTabsController.getPinnedIdByTabId(activeTabOrGroup.id) !== null;
}

/**
 * Moves the active tab/group for a window-space into the given window.
 * Captures a screenshot before moving so the old window gets a placeholder.
 *
 * @param isStale — optional callback that returns true when a newer focus
 *   event has fired, so this (now-outdated) move should be abandoned.
 */
async function moveActiveTabToWindow(window: BrowserWindow, isStale?: () => boolean): Promise<void> {
  const tabsController = getTabsController();
  const spaceId = window.currentSpaceId;
  if (!spaceId) return;

  const activeTabOrGroup = tabsController.getActiveTab(window.id, spaceId);
  if (!activeTabOrGroup) return;

  clearPlaceholderInRenderer(window.id);

  if (activeTabOrGroup instanceof Tab) {
    // Internal-profile and popup-window tabs must not be synced across windows
    if (isSyncExcludedTab(activeTabOrGroup)) return;
    await moveTabToWindowIfNeeded(activeTabOrGroup, window, isStale);
  } else if (activeTabOrGroup instanceof BaseTabGroup) {
    // If any tab in the group is excluded from sync, skip the entire group move
    if (activeTabOrGroup.tabs.some(isSyncExcludedTab)) return;
    // Check staleness before starting the group move. Once begun, complete
    // the full group to avoid leaving it split across windows.
    if (isStale?.()) return;
    for (const tab of activeTabOrGroup.tabs) {
      await moveTabToWindowIfNeeded(tab, window);
    }
  }
}

/**
 * Moves a single tab's view to a window if it isn't already there.
 * The placeholder is sent BEFORE moving so it loads behind the native view,
 * eliminating flicker. Resets `tab.visible` so the new window re-shows it.
 *
 * @param isStale — optional callback checked after the async screenshot
 *   capture. If it returns true the move is abandoned (a newer focus event
 *   superseded this one).
 */
async function moveTabToWindowIfNeeded(tab: Tab, window: BrowserWindow, isStale?: () => boolean): Promise<void> {
  if (tab.isDestroyed || window.destroyed) return;
  if (tab.getWindow().id !== window.id) {
    const oldWindow = tab.getWindow();
    if (oldWindow.destroyed) return;

    // Capture before the move — view must be attached for a valid surface
    const screenshot = await captureTabScreenshot(tab);

    // A newer focus event arrived while we were capturing — abort
    if (isStale?.()) return;
    if (tab.isDestroyed || window.destroyed || oldWindow.destroyed) return;

    // Send placeholder to old window before moving (loads behind the native view)
    if (screenshot) {
      sendPlaceholderToRenderer(oldWindow, tab.spaceId, tab.id, screenshot);
    }

    // Move the tab to the new window
    tab.visible = false;
    tab.setWindow(window);

    // Reset cached bounds so the layout manager re-applies for the new window
    const tabsController = getTabsController();
    const layoutManager = tabsController.getLayoutManager(tab.id);
    layoutManager?.onWindowChanged();
  }
}

/**
 * Moves a tab (and its group members) to a window with placeholder handling.
 * Used by IPC handlers (e.g. `tabs:switch-to-tab`).
 */
export async function moveTabOrGroupToWindow(tab: Tab, window: BrowserWindow): Promise<void> {
  const tabsController = getTabsController();

  clearPlaceholderInRenderer(window.id);

  const tabGroup = tabsController.getTabGroupByTabId(tab.id);
  if (tabGroup) {
    for (const groupTab of tabGroup.tabs) {
      await moveTabToWindowIfNeeded(groupTab, window);
    }
  } else {
    await moveTabToWindowIfNeeded(tab, window);
  }
}

// Helper to find a window with a specific profile active in its current space
function findWindowWithProfile(windows: BrowserWindow[], profileId: string): BrowserWindow | null {
  for (const win of windows) {
    const spaceId = win.currentSpaceId;
    if (!spaceId) continue;
    const space = spacesController.getFromCache(spaceId);
    if (space?.profileId === profileId) {
      return win;
    }
  }
  return null;
}

/**
 * Relocates tabs from a closing window to a surviving window.
 *
 * Called from BrowserWindow.destroy(). When sync is enabled and other browser
 * windows exist, tabs are moved instead of destroyed so the shared tab set
 * survives the window close.
 *
 * Internal-profile (e.g. incognito) tabs can only relocate to a surviving
 * window that has the same profile active in its current space. If no such
 * window exists, they are returned as unrelocatable for destruction.
 *
 * @param tabs  Tabs that belonged to the closing window (captured before the
 *              window was removed from the controller).
 * @returns The list of tabs that were **not** relocated and still need
 *          destruction, or `null` when sync is disabled / no surviving
 *          windows exist (meaning the caller should destroy all tabs).
 */
export function relocateTabsFromClosingWindow(closingWindow: BrowserWindow, tabs: Tab[]): Tab[] | null {
  if (!isTabSyncEnabled()) return null;

  const closingWindowId = closingWindow.id;
  // Popup-window tabs should never be relocated to normal windows
  if (closingWindow.browserWindowType === "popup") return null;

  const survivingWindows = browserWindowsController
    .getWindows()
    .filter((w) => w.id !== closingWindowId && w.browserWindowType === "normal");
  if (survivingWindows.length === 0) return null;

  const tabsController = getTabsController();
  const defaultTargetWindow = survivingWindows[0];

  // Tabs from internal profiles (e.g. incognito) can only relocate to windows
  // with the same profile active. Regular tabs can relocate to any window.
  const relocatable = new Map<BrowserWindow, Tab[]>();
  const unrelocatable: Tab[] = [];

  for (const tab of tabs) {
    const isInternal = tab.loadedProfile.profileData.internal;
    if (isInternal) {
      // Try to find a window with the same profile
      const targetWindow = findWindowWithProfile(survivingWindows, tab.profileId);
      if (targetWindow) {
        const list = relocatable.get(targetWindow) ?? [];
        list.push(tab);
        relocatable.set(targetWindow, list);
      } else {
        unrelocatable.push(tab);
      }
    } else {
      // Regular tabs go to the default target
      const list = relocatable.get(defaultTargetWindow) ?? [];
      list.push(tab);
      relocatable.set(defaultTargetWindow, list);
    }
  }

  // Relocate tabs to their respective target windows
  for (const [targetWindow, windowTabs] of relocatable) {
    for (const tab of windowTabs) {
      tab.visible = false;
      tab.setWindow(targetWindow);

      const layoutManager = tabsController.getLayoutManager(tab.id);
      layoutManager?.onWindowChanged();
    }
  }

  // Unrelocatable tabs are about to be destroyed. Clear any active/focused
  // references that surviving windows hold to these tabs so that
  // relocateDisplacedTabs doesn't try (and fail) to move them.
  if (unrelocatable.length > 0) {
    const unrelocatableIds = new Set(unrelocatable.map((t) => t.id));
    for (const win of survivingWindows) {
      const spaceId = win.currentSpaceId;
      if (!spaceId) continue;

      const active = tabsController.getActiveTab(win.id, spaceId);
      if (!active) continue;

      // Check if the active element is (or contains) an unrelocatable tab
      const isStale =
        active instanceof Tab
          ? unrelocatableIds.has(active.id)
          : active.tabs.some((t: Tab) => unrelocatableIds.has(t.id));

      if (isStale) {
        tabsController.removeActiveTab(win.id, spaceId);
      }
    }
  }

  // Purge stale map entries for the closing window
  tabsController.cleanupWindowEntries(closingWindowId);

  // Re-run layout so each target window shows the correct active tab
  for (const targetWindow of relocatable.keys()) {
    const targetSpaceId = targetWindow.currentSpaceId;
    if (targetSpaceId) {
      tabsController.emit("active-tab-changed", targetWindow.id, targetSpaceId);
    }
  }

  return unrelocatable;
}

// Automatic tab relocation

let _syncMoveQueue: Promise<void> = Promise.resolve();

async function runTabSyncMutation<T>(work: () => Promise<T>): Promise<T> {
  const run = _syncMoveQueue.then(work, work);
  _syncMoveQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

let _relocating = false;
let _relocateRequested = false;

/**
 * Finds tabs whose views are in the wrong window and moves them back.
 *
 * After a tab switch in Window A, the previously-active tab may still have
 * its WebContentsView attached to A even though Window B has it as active.
 * This function detects that situation and moves the view to B, clearing
 * the placeholder there.
 *
 * Guard: if the tab is active in BOTH the current owner window and the
 * target window (e.g. right after a focus-move), the tab usually stays put.
 * The exception is when the target window is currently focused: a space switch
 * inside that focused window does not emit a new focus event, so the tab must
 * still be reclaimed there.
 */
async function relocateDisplacedTabs(): Promise<void> {
  _relocateRequested = true;
  if (_relocating) return;
  _relocating = true;

  try {
    while (_relocateRequested) {
      _relocateRequested = false;

      await runTabSyncMutation(async () => {
        const tabsController = getTabsController();
        const allWindows = browserWindowsController.getWindows().filter((w) => w.browserWindowType === "normal");

        // Build a map: windowId -> all active tabs for its current space.
        // For tab groups, every member tab is included so that the full group
        // is relocated together (not just the first/representative tab).
        const windowActiveTabs = new Map<number, Tab[]>();
        const windowWantedTabIds = new Map<number, Set<number>>();

        for (const win of allWindows) {
          const spaceId = win.currentSpaceId;
          if (!spaceId) continue;

          const active = tabsController.getActiveTab(win.id, spaceId);
          if (!active) continue;

          const tabs: Tab[] = active instanceof Tab ? [active] : [...active.tabs];

          // Internal-profile and popup-window tabs are not synced — skip them
          const syncableTabs = tabs.filter((t) => !isSyncExcludedTab(t));
          if (syncableTabs.length === 0) continue;

          windowActiveTabs.set(win.id, syncableTabs);
          windowWantedTabIds.set(win.id, new Set(syncableTabs.map((t) => t.id)));
        }

        // For each window, check if any of its wanted tabs are in the wrong window
        for (const [targetWindowId, tabs] of windowActiveTabs) {
          for (const tab of tabs) {
            if (tab.isDestroyed) {
              continue;
            }
            const viewOwnerWindowId = tab.getWindow().id;
            if (viewOwnerWindowId === targetWindowId) continue; // already here

            // If the owner window no longer exists (destroyed), the tab is
            // orphaned and will be cleaned up by its scheduled destruction.
            // Attempting to relocate it would fail and re-trigger this
            // function in an infinite loop.
            if (!browserWindowsController.getWindowById(viewOwnerWindowId)) continue;

            const targetWindow = browserWindowsController.getWindowById(targetWindowId);
            if (!targetWindow) continue;

            // Is the tab also wanted by the window that currently owns the view?
            const ownerWanted = windowWantedTabIds.get(viewOwnerWindowId);
            if (ownerWanted?.has(tab.id) && !targetWindow.browserWindow.isFocused()) {
              // Both windows want this tab and the target window is not
              // focused — don't steal the view from the current owner.
              continue;
            }

            clearPlaceholderInRenderer(targetWindowId);

            await moveTabToWindowIfNeeded(tab, targetWindow);

            // Let processActiveTabChange re-show the tab in the target window
            const spaceId = targetWindow.currentSpaceId;
            if (spaceId) {
              tabsController.emit("active-tab-changed", targetWindowId, spaceId);
            }
          }
        }
      });
    }
  } finally {
    _relocating = false;
  }
}

// Focus-move staleness detection
//
// When the app regains focus, the OS/Electron can fire a transient `focus`
// event on the wrong window before the real target receives focus. Both
// events trigger async tab moves that race. The generation counter lets
// the stale move bail out after its async screenshot capture completes.

let _focusMoveGeneration = 0;

/** Initializes tab sync listeners. Call once at app startup. */
export function initTabSync(): void {
  // Move the active tab's view to the focused window
  windowsController.on("window-focused", (id) => {
    const window = browserWindowsController.getWindowById(id);
    if (!window || window.browserWindowType !== "normal") return;

    const generation = ++_focusMoveGeneration;
    const isStale = () => generation !== _focusMoveGeneration;

    // Async: capture screenshot, move tab, then emit active-tab-changed
    runTabSyncMutation(async () => {
      if (window.destroyed || isStale()) return;
      const spaceId = window.currentSpaceId;
      if (!spaceId) return;
      if (isStale()) return;

      // Pinned-tab associations always sync across windows regardless of the
      // syncTabsAcrossWindows setting. For regular tabs, only proceed when
      // tab sync is enabled.
      if (!shouldSyncSharedActiveTab(window, spaceId)) return;

      await moveActiveTabToWindow(window, isStale);
      if (isStale()) return;
      const currentSpaceId = window.currentSpaceId;
      if (!currentSpaceId) return;
      const tabsController = getTabsController();
      tabsController.focusActiveTab(window.id, currentSpaceId);
      tabsController.emit("active-tab-changed", window.id, currentSpaceId);
    }).catch((err) => {
      console.error("[tab-sync] Failed to move active tab on focus:", err);
    });
  });

  // Relocate displaced tabs when the active tab or space changes
  const tabsController = getTabsController();

  tabsController.on("active-tab-changed", (windowId) => {
    reconcilePlaceholderForWindow(windowId);
    if (!isTabSyncEnabled()) return;
    relocateDisplacedTabs().catch((err) => {
      console.error("[tab-sync] Failed to relocate displaced tabs:", err);
    });
  });

  tabsController.on("current-space-changed", (windowId) => {
    reconcilePlaceholderForWindow(windowId);

    const window = browserWindowsController.getWindowById(windowId);
    if (window && window.browserWindowType === "normal") {
      const expectedSpaceId = window.currentSpaceId;
      if (expectedSpaceId && shouldSyncSharedActiveTab(window, expectedSpaceId)) {
        const isStale = () => window.currentSpaceId !== expectedSpaceId;

        runTabSyncMutation(async () => {
          if (window.destroyed || isStale()) return;
          await moveActiveTabToWindow(window, isStale);
          if (isStale()) return;

          const tabsController = getTabsController();
          tabsController.focusActiveTab(window.id, expectedSpaceId);
          tabsController.emit("active-tab-changed", window.id, expectedSpaceId);
        }).catch((err) => {
          console.error("[tab-sync] Failed to move active tab on space change:", err);
        });
      }
    }

    if (!isTabSyncEnabled()) return;
    relocateDisplacedTabs().catch((err) => {
      console.error("[tab-sync] Failed to relocate displaced tabs on space change:", err);
    });
  });

  // Clean up placeholders and stale map entries when windows are destroyed
  windowsController.on("window-removed", (id) => {
    clearPlaceholderInRenderer(id);
    windowPlaceholderGeneration.delete(id);
    tabsController.cleanupWindowEntries(id);
  });
}

export { runTabSyncMutation };
