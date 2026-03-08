/**
 * Tab Sync — shared tab state across windows.
 *
 * When enabled via the "syncTabsAcrossWindows" setting, every browser
 * window sees the same set of tabs (like Arc). Each window independently
 * tracks which tab is active, but the tab list is global. When a window
 * gains focus, the active tab's WebContentsView is moved to that window
 * so Electron can render it there.
 *
 * When disabled (the default), each window has its own independent tabs
 * (like Chrome).
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

// ---------------------------------------------------------------------------
// TabsController registration (avoids circular dependency)
// ---------------------------------------------------------------------------

let _tabsController: TabsController | null = null;

/**
 * Registers the TabsController singleton so tab-sync helpers can access it
 * without a circular `require("./index")` call.
 */
export function registerTabsController(tc: TabsController): void {
  _tabsController = tc;
}

function getTabsController(): TabsController {
  if (!_tabsController) {
    throw new Error("[tab-sync] TabsController not registered yet. Call registerTabsController() first.");
  }
  return _tabsController;
}

// ---------------------------------------------------------------------------
// Screenshot placeholders (served via flow-internal://tab-snapshot protocol)
// ---------------------------------------------------------------------------

/**
 * Generation counter per window. Incremented every time we start a new
 * placeholder capture for a window. When the async `capturePage()` resolves
 * we compare the generation — if it's stale (another capture was started,
 * or the placeholder was removed) we discard the result. This prevents
 * the race where a fast focus-switch causes a late-resolving capture to
 * create a stale placeholder on top of a real tab.
 */
const placeholderGeneration: Map<number, number> = new Map();

/** Tracks the current snapshot UUID per window so we can free it on clear. */
const windowSnapshotId: Map<number, string> = new Map();

/**
 * Captures a screenshot of the tab's current content. Must be called while
 * the tab's view is still attached to a window — once the view is moved,
 * the compositor surface is invalidated and the capture returns empty.
 *
 * Returns `null` if capture fails or produces an empty image.
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

/**
 * Sends a screenshot placeholder to the target window's renderer process.
 * Stores the image in the protocol handler and sends a lightweight URL
 * string (not the image data itself) via IPC.
 */
function sendPlaceholderToRenderer(targetWindow: BrowserWindow, image: Electron.NativeImage): void {
  const win = browserWindowsController.getWindowById(targetWindow.id);
  if (!win) return;

  // Clean up any previous snapshot for this window
  const prevId = windowSnapshotId.get(targetWindow.id);
  if (prevId) {
    removeSnapshot(prevId);
  }

  const snapshotId = storeSnapshot(image);
  windowSnapshotId.set(targetWindow.id, snapshotId);

  const url = `flow-internal://tab-snapshot?id=${snapshotId}`;
  win.sendMessageToCoreWebContents("tabs:on-placeholder-changed", url);
}

/**
 * Clears the screenshot placeholder in the target window's renderer process.
 * Also frees the stored snapshot buffer to release memory.
 */
function clearPlaceholderInRenderer(windowId: number): void {
  placeholderGeneration.delete(windowId);

  // Free the stored snapshot buffer
  const snapshotId = windowSnapshotId.get(windowId);
  if (snapshotId) {
    removeSnapshot(snapshotId);
    windowSnapshotId.delete(windowId);
  }

  const win = browserWindowsController.getWindowById(windowId);
  if (!win) return;

  win.sendMessageToCoreWebContents("tabs:on-placeholder-changed", null);
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Returns whether tab syncing across windows is currently enabled.
 */
export function isTabSyncEnabled(): boolean {
  return getSettingValueById("syncTabsAcrossWindows") === true;
}

/**
 * Moves the active tab (or tab group) for a window-space into the
 * given window, so Electron can render the WebContentsView there.
 *
 * Also removes any screenshot placeholder in the target window
 * (the real tab content is about to appear there).
 *
 * The capture is awaited BEFORE the view is moved so that the compositor
 * surface is still valid (the view must be attached to a window for
 * capturePage to return a non-empty image).
 *
 * This is called when a window gains focus or when a tab is switched
 * to in sync mode.
 */
export async function moveActiveTabToWindow(window: BrowserWindow): Promise<void> {
  const tabsController = getTabsController();
  const spaceId = window.currentSpaceId;
  if (!spaceId) return;

  const activeTabOrGroup = tabsController.getActiveTab(window.id, spaceId);
  if (!activeTabOrGroup) return;

  // Remove placeholder in the TARGET window — real content is arriving
  clearPlaceholderInRenderer(window.id);

  if (activeTabOrGroup instanceof Tab) {
    await moveTabToWindowIfNeeded(activeTabOrGroup, window);
  } else if (activeTabOrGroup instanceof BaseTabGroup) {
    for (const tab of activeTabOrGroup.tabs) {
      await moveTabToWindowIfNeeded(tab, window);
    }
  }
}

/**
 * Moves a single tab's view to a window if it isn't already there.
 *
 * The placeholder is sent to the old window's renderer BEFORE moving
 * the tab. Because the native WebContentsView sits on top of the
 * renderer, the `<img>` loads invisibly behind it. When `setWindow()`
 * removes the view, the placeholder is already in place — eliminating
 * the flicker that would occur if the image had to load after the
 * view vanished.
 *
 * Resets `tab.visible` to `false` so that the subsequent
 * `processActiveTabChange` in the new window correctly sees the tab as
 * not-yet-visible and calls `layout.show()`. Without this reset, the
 * stale `visible = true` from the old window causes the show path to be
 * skipped (the "double-click to make tabs visible" bug).
 */
async function moveTabToWindowIfNeeded(tab: Tab, window: BrowserWindow): Promise<void> {
  if (tab.getWindow().id !== window.id) {
    const oldWindow = tab.getWindow();

    // Capture BEFORE the move — the view must be attached for a valid surface
    const screenshot = await captureTabScreenshot(tab);

    // Send the placeholder to the old window BEFORE moving the tab.
    // The <img> loads behind the native WebContentsView (which is still
    // on top), so by the time setWindow() removes the view the
    // placeholder is already rendered — no flicker.
    if (screenshot) {
      sendPlaceholderToRenderer(oldWindow, screenshot);
    }

    // Now move the tab to the new window
    tab.visible = false;
    tab.setWindow(window);

    // Reset cached bounds/border-radius so the layout manager re-applies
    // them for the new window's pageBounds instead of skipping due to
    // stale equality with the old window's cached values.
    const tabsController = getTabsController();
    const layoutManager = tabsController.getLayoutManager(tab.id);
    layoutManager?.onWindowChanged();
  }
}

/**
 * Moves a tab (and its group members) to a window, creating screenshot
 * placeholders in the old window. This is the public API used by IPC
 * handlers (e.g. `tabs:switch-to-tab`) so the placeholder logic is
 * consistent everywhere.
 */
export async function moveTabOrGroupToWindow(tab: Tab, window: BrowserWindow): Promise<void> {
  const tabsController = getTabsController();

  // Remove any existing placeholder in the target window
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
 * If no active tab is set yet (e.g. a new window just opened),
 * inherits the active tab from another window viewing the same space.
 *
 * Directly sets `spaceActiveTabMap` to avoid `setActiveTab()` which
 * derives the window ID from the tab's current window (wrong for this case).
 */
export function ensureActiveTabForWindowSpace(windowId: number, spaceId: string): void {
  const tabsController = getTabsController();
  const existing = tabsController.getActiveTab(windowId, spaceId);
  if (existing) return;

  // Find an active tab/group from any other window in the same space
  const allWindows = browserWindowsController.getWindows();
  for (const otherWindow of allWindows) {
    if (otherWindow.id === windowId) continue;
    const otherActive = tabsController.getActiveTab(otherWindow.id, spaceId);
    if (otherActive) {
      // Directly set the active tab/group for the target window-space key.
      // We can't use setActiveTab() because it reads windowId from the
      // tab's/group's current window, which is the OTHER window.
      const key = `${windowId}-${spaceId}` as `${number}-${string}`;
      tabsController.spaceActiveTabMap.set(key, otherActive);
      return;
    }
  }

  // No other window has an active tab — try to pick the first tab in the space
  const tabsInSpace = tabsController.getTabsInSpace(spaceId);
  if (tabsInSpace.length > 0) {
    const key = `${windowId}-${spaceId}` as `${number}-${string}`;
    tabsController.spaceActiveTabMap.set(key, tabsInSpace[0]);
  }
}

/**
 * Initializes the tab sync system. Should be called once during
 * app startup (after controllers are ready).
 */
export function initTabSync(): void {
  // When a browser window gains focus, move its active tab's view there
  windowsController.on("window-focused", (id) => {
    if (!isTabSyncEnabled()) return;

    const window = browserWindowsController.getWindowById(id);
    if (!window) return;

    const spaceId = window.currentSpaceId;
    if (!spaceId) return;

    // moveActiveTabToWindow is async (awaits capturePage before moving).
    // We chain the emit so processActiveTabChange runs after the move.
    moveActiveTabToWindow(window).then(() => {
      const tabsController = getTabsController();
      tabsController.emit("active-tab-changed", window.id, spaceId);
    });
  });

  // Clean up placeholders when windows are destroyed
  windowsController.on("window-removed", (id) => {
    clearPlaceholderInRenderer(id);
  });
}
