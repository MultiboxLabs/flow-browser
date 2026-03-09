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
import { BrowserWindow } from "@/controllers/windows-controller/types";
import {
  storeSnapshot,
  removeSnapshot
} from "@/controllers/sessions-controller/protocols/_protocols/flow-internal/tab-snapshot";
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

/** Current snapshot UUID per window, for cleanup. */
const windowSnapshotId: Map<number, string> = new Map();

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

/** Stores a snapshot and sends its URL to the target window's renderer. */
function sendPlaceholderToRenderer(targetWindow: BrowserWindow, image: Electron.NativeImage): void {
  const win = browserWindowsController.getWindowById(targetWindow.id);
  if (!win) return;

  const prevId = windowSnapshotId.get(targetWindow.id);
  if (prevId) {
    removeSnapshot(prevId);
  }

  const snapshotId = storeSnapshot(image);
  windowSnapshotId.set(targetWindow.id, snapshotId);

  const url = `flow-internal://tab-snapshot?id=${snapshotId}`;
  win.sendMessageToCoreWebContents("tabs:on-placeholder-changed", url);
}

/** Clears the placeholder in a window and frees the stored snapshot. */
function clearPlaceholderInRenderer(windowId: number): void {
  const snapshotId = windowSnapshotId.get(windowId);
  if (snapshotId) {
    removeSnapshot(snapshotId);
    windowSnapshotId.delete(windowId);
  }

  const win = browserWindowsController.getWindowById(windowId);
  if (!win) return;

  win.sendMessageToCoreWebContents("tabs:on-placeholder-changed", null);
}

// Core helpers

export function isTabSyncEnabled(): boolean {
  return getSettingValueById("syncTabsAcrossWindows") === true;
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
    await moveTabToWindowIfNeeded(activeTabOrGroup, window, isStale);
  } else if (activeTabOrGroup instanceof BaseTabGroup) {
    for (const tab of activeTabOrGroup.tabs) {
      if (isStale?.()) return;
      await moveTabToWindowIfNeeded(tab, window, isStale);
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
  if (tab.getWindow().id !== window.id) {
    const oldWindow = tab.getWindow();

    // Capture before the move — view must be attached for a valid surface
    const screenshot = await captureTabScreenshot(tab);

    // A newer focus event arrived while we were capturing — abort
    if (isStale?.()) return;

    // Send placeholder to old window before moving (loads behind the native view)
    if (screenshot) {
      sendPlaceholderToRenderer(oldWindow, screenshot);
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

/**
 * Ensures the target window has an active tab for the given space.
 * If none is set, inherits from another window or picks the first tab.
 * Sets `spaceActiveTabMap` directly (can't use `setActiveTab()` because
 * it derives windowId from the tab's current window).
 */
export function ensureActiveTabForWindowSpace(windowId: number, spaceId: string): void {
  const tabsController = getTabsController();
  const existing = tabsController.getActiveTab(windowId, spaceId);
  if (existing) return;

  // Find an active tab/group from another window in the same space
  const allWindows = browserWindowsController.getWindows();
  for (const otherWindow of allWindows) {
    if (otherWindow.id === windowId) continue;
    const otherActive = tabsController.getActiveTab(otherWindow.id, spaceId);
    if (otherActive) {
      const key = `${windowId}-${spaceId}` as `${number}-${string}`;
      tabsController.spaceActiveTabMap.set(key, otherActive);
      return;
    }
  }

  // Fallback: pick the first tab in the space
  const tabsInSpace = tabsController.getTabsInSpace(spaceId);
  if (tabsInSpace.length > 0) {
    const key = `${windowId}-${spaceId}` as `${number}-${string}`;
    tabsController.spaceActiveTabMap.set(key, tabsInSpace[0]);
  }
}

// Automatic tab relocation

let _relocating = false;

/**
 * Finds tabs whose views are in the wrong window and moves them back.
 *
 * After a tab switch in Window A, the previously-active tab may still have
 * its WebContentsView attached to A even though Window B has it as active.
 * This function detects that situation and moves the view to B, clearing
 * the placeholder there.
 *
 * Guard: if the tab is active in BOTH the current owner window and the
 * target window (e.g. right after a focus-move), the tab stays put — the
 * focus handler already placed it correctly.
 */
async function relocateDisplacedTabs(): Promise<void> {
  if (_relocating) return;
  _relocating = true;

  try {
    const tabsController = getTabsController();
    const allWindows = browserWindowsController.getWindows();

    // Build a map: windowId -> active Tab for its current space
    // (only plain Tab entries — groups are expanded to their member tabs elsewhere)
    const windowActiveTab = new Map<number, Tab>();
    for (const win of allWindows) {
      const spaceId = win.currentSpaceId;
      if (!spaceId) continue;

      const active = tabsController.getActiveTab(win.id, spaceId);
      if (!active) continue;

      if (active instanceof Tab) {
        windowActiveTab.set(win.id, active);
      } else if (active instanceof BaseTabGroup) {
        // For groups, consider the front/first tab as the representative
        const frontTab = active.tabs[0];
        if (frontTab) {
          windowActiveTab.set(win.id, frontTab);
        }
      }
    }

    // For each window that wants a tab, check if the view is elsewhere
    for (const [targetWindowId, tab] of windowActiveTab) {
      const viewOwnerWindowId = tab.getWindow().id;
      if (viewOwnerWindowId === targetWindowId) continue; // already here

      // Is the tab also active in the window that currently owns the view?
      const ownerActiveTab = windowActiveTab.get(viewOwnerWindowId);
      if (ownerActiveTab && ownerActiveTab.id === tab.id) {
        // Both windows want this tab and the owner still has it active —
        // don't fight the focus handler.
        continue;
      }

      // The owner window no longer needs this tab — relocate it
      const targetWindow = browserWindowsController.getWindowById(targetWindowId);
      if (!targetWindow) continue;

      clearPlaceholderInRenderer(targetWindowId);

      await moveTabToWindowIfNeeded(tab, targetWindow);

      // Let processActiveTabChange re-show the tab in the target window
      const spaceId = targetWindow.currentSpaceId;
      if (spaceId) {
        tabsController.emit("active-tab-changed", targetWindowId, spaceId);
      }
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
    if (!isTabSyncEnabled()) return;

    const window = browserWindowsController.getWindowById(id);
    if (!window) return;

    const spaceId = window.currentSpaceId;
    if (!spaceId) return;

    const generation = ++_focusMoveGeneration;
    const isStale = () => generation !== _focusMoveGeneration;

    // Async: capture screenshot, move tab, then emit active-tab-changed
    moveActiveTabToWindow(window, isStale)
      .then(() => {
        if (isStale()) return;
        const tabsController = getTabsController();
        tabsController.emit("active-tab-changed", window.id, spaceId);
      })
      .catch((err) => {
        console.error("[tab-sync] Failed to move active tab on focus:", err);
      });
  });

  // Relocate displaced tabs when the active tab or space changes
  const tabsController = getTabsController();

  tabsController.on("active-tab-changed", () => {
    if (!isTabSyncEnabled()) return;
    relocateDisplacedTabs().catch((err) => {
      console.error("[tab-sync] Failed to relocate displaced tabs:", err);
    });
  });

  tabsController.on("current-space-changed", () => {
    if (!isTabSyncEnabled()) return;
    relocateDisplacedTabs().catch((err) => {
      console.error("[tab-sync] Failed to relocate displaced tabs on space change:", err);
    });
  });

  // Clean up placeholders when windows are destroyed
  windowsController.on("window-removed", (id) => {
    clearPlaceholderInRenderer(id);
  });
}
