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
 */
async function moveActiveTabToWindow(window: BrowserWindow): Promise<void> {
  const tabsController = getTabsController();
  const spaceId = window.currentSpaceId;
  if (!spaceId) return;

  const activeTabOrGroup = tabsController.getActiveTab(window.id, spaceId);
  if (!activeTabOrGroup) return;

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
 * The placeholder is sent BEFORE moving so it loads behind the native view,
 * eliminating flicker. Resets `tab.visible` so the new window re-shows it.
 */
async function moveTabToWindowIfNeeded(tab: Tab, window: BrowserWindow): Promise<void> {
  if (tab.getWindow().id !== window.id) {
    const oldWindow = tab.getWindow();

    // Capture before the move — view must be attached for a valid surface
    const screenshot = await captureTabScreenshot(tab);

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

/** Initializes tab sync listeners. Call once at app startup. */
export function initTabSync(): void {
  // Move the active tab's view to the focused window
  windowsController.on("window-focused", (id) => {
    if (!isTabSyncEnabled()) return;

    const window = browserWindowsController.getWindowById(id);
    if (!window) return;

    const spaceId = window.currentSpaceId;
    if (!spaceId) return;

    // Async: capture screenshot, move tab, then emit active-tab-changed
    moveActiveTabToWindow(window)
      .then(() => {
        const tabsController = getTabsController();
        tabsController.emit("active-tab-changed", window.id, spaceId);
      })
      .catch((err) => {
        console.error("[tab-sync] Failed to move active tab on focus:", err);
      });
  });

  // Clean up placeholders when windows are destroyed
  windowsController.on("window-removed", (id) => {
    clearPlaceholderInRenderer(id);
  });
}
