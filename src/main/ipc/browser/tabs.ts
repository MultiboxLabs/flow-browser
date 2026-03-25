import { BaseTabGroup, TabGroup } from "@/controllers/tabs-controller/tab-groups";
import { spacesController } from "@/controllers/spaces-controller";
import { clipboard, ipcMain, Menu, MenuItem } from "electron";
import { TabData, WindowActiveTabIds, WindowFocusedTabIds } from "~/types/tabs";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { Tab } from "@/controllers/tabs-controller/tab";
import { tabsController } from "@/controllers/tabs-controller";
import { restoreRecentlyClosedTabInWindow } from "@/controllers/tabs-controller/recently-closed";
import { serializeTabForRenderer, serializeTabGroupForRenderer } from "@/saving/tabs/serialization";
import { recentlyClosedManager } from "@/controllers/tabs-controller/recently-closed-manager";
import {
  isTabSyncEnabled,
  isSyncExcludedTab,
  moveTabOrGroupToWindow,
  runTabSyncMutation
} from "@/controllers/tabs-controller/tab-sync";

// IPC Handlers //
function getWindowTabsData(window: BrowserWindow) {
  const windowId = window.id;
  const syncEnabled = isTabSyncEnabled();

  // When sync is enabled, return all tabs across all windows EXCEPT
  // internal-profile tabs and popup-window tabs that belong to other windows
  // (those stay private). Popup windows themselves are not part of sync.
  let tabs: Tab[];
  let tabGroups: TabGroup[];

  if (syncEnabled && window.browserWindowType === "normal") {
    tabs = [...tabsController.tabs.values()].filter((tab) => {
      if (tab.getWindow().id === windowId) return true;
      return !isSyncExcludedTab(tab);
    });
    // Include tab groups that still have at least one visible tab
    const visibleTabIds = new Set(tabs.map((t) => t.id));
    tabGroups = [...tabsController.tabGroups.values()].filter((group) =>
      group.tabs.some((t) => visibleTabIds.has(t.id))
    );
  } else {
    tabs = tabsController.getTabsInWindow(windowId);
    tabGroups = tabsController.getTabGroupsInWindow(windowId);
  }

  const tabDatas = tabs.map((tab) => {
    const managers = tabsController.getTabManagers(tab.id);
    return serializeTabForRenderer(tab, managers?.lifecycle.preSleepState);
  });
  const tabGroupDatas = tabGroups.map((tabGroup) => serializeTabGroupForRenderer(tabGroup));

  const windowProfiles: string[] = [];
  const windowSpaces: string[] = [];

  for (const tab of tabs) {
    if (!windowProfiles.includes(tab.profileId)) {
      windowProfiles.push(tab.profileId);
    }
    if (!windowSpaces.includes(tab.spaceId)) {
      windowSpaces.push(tab.spaceId);
    }
  }

  const focusedTabs: WindowFocusedTabIds = {};
  const activeTabs: WindowActiveTabIds = {};

  for (const spaceId of windowSpaces) {
    const focusedTab = tabsController.getFocusedTab(windowId, spaceId);
    if (focusedTab) {
      focusedTabs[spaceId] = focusedTab.id;
    }

    const activeTab = tabsController.getActiveTab(windowId, spaceId);
    if (activeTab) {
      if (activeTab instanceof BaseTabGroup) {
        activeTabs[spaceId] = activeTab.tabs.map((tab) => tab.id);
      } else {
        activeTabs[spaceId] = [activeTab.id];
      }
    }
  }

  return {
    tabs: tabDatas,
    tabGroups: tabGroupDatas,
    focusedTabIds: focusedTabs,
    activeTabIds: activeTabs
  };
}

ipcMain.handle("tabs:get-data", async (event) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return null;

  return getWindowTabsData(window);
});

// --- Tab change queues ---
//
// Two queues track pending IPC updates:
//
// 1. Structural changes (tab created/removed, active tab changed, space changed)
//    require a full WindowTabsData refresh because the tab list, groups,
//    focused/active maps may all have changed.
//
// 2. Content changes (title, url, isLoading, audible, etc.) only affect
//    individual tabs. For these, we serialize just the changed tabs and send
//    a lightweight "tabs:on-tabs-content-updated" message instead of the
//    full data set.
//
// If a structural change occurs during the debounce window, it absorbs any
// pending content changes for that window (the full refresh includes them).

const DEBOUNCE_MS = 80;

/** Windows that need a full data refresh (structural change). */
const structuralQueue: Set<number> = new Set();

/** Windows → set of tab IDs with content-only changes. */
const contentQueue: Map<number, Set<number>> = new Map();

let queueTimeout: NodeJS.Timeout | null = null;

function scheduleQueueProcessing() {
  if (queueTimeout) return; // already scheduled
  queueTimeout = setTimeout(() => {
    processQueues();
    queueTimeout = null;
  }, DEBOUNCE_MS);
}

function processQueues() {
  // --- Structural changes (full refresh) ---
  for (const windowId of structuralQueue) {
    const window = browserWindowsController.getWindowById(windowId);
    if (!window) continue;

    const data = getWindowTabsData(window);
    if (!data) continue;

    window.sendMessageToCoreWebContents("tabs:on-data-changed", data);

    // Content changes for this window are absorbed by the full refresh
    contentQueue.delete(windowId);
  }
  structuralQueue.clear();

  // --- Content-only changes (lightweight per-tab updates) ---
  for (const [windowId, tabIds] of contentQueue) {
    const window = browserWindowsController.getWindowById(windowId);
    if (!window) continue;

    const updatedTabs: TabData[] = [];
    for (const tabId of tabIds) {
      const tab = tabsController.getTabById(tabId);
      if (!tab) continue;

      const managers = tabsController.getTabManagers(tabId);
      updatedTabs.push(serializeTabForRenderer(tab, managers?.lifecycle.preSleepState));
    }

    if (updatedTabs.length > 0) {
      window.sendMessageToCoreWebContents("tabs:on-tabs-content-updated", updatedTabs);
    }
  }
  contentQueue.clear();
}

/**
 * Enqueue a structural change for a window.
 * The next queue processing will send a full WindowTabsData refresh.
 * When tab sync is enabled, all browser windows are notified.
 */
export function windowTabsChanged(windowId: number) {
  if (isTabSyncEnabled()) {
    // Broadcast to every browser window
    for (const win of browserWindowsController.getWindows()) {
      structuralQueue.add(win.id);
    }
  } else {
    structuralQueue.add(windowId);
  }
  scheduleQueueProcessing();
}

/**
 * Enqueue a content-only change for a single tab.
 * If no structural change occurs before processing, only the changed tabs'
 * data will be serialized and sent — much cheaper than a full refresh.
 * When tab sync is enabled, the change is enqueued for all browser windows.
 */
export function windowTabContentChanged(windowId: number, tabId: number) {
  let targetWindowIds: number[];

  if (isTabSyncEnabled()) {
    // Internal-profile and popup-window tabs are not synced — only notify the owning window
    const tab = tabsController.getTabById(tabId);
    if (tab && isSyncExcludedTab(tab)) {
      targetWindowIds = [windowId];
    } else {
      targetWindowIds = browserWindowsController.getWindows().map((w) => w.id);
    }
  } else {
    targetWindowIds = [windowId];
  }

  for (const targetId of targetWindowIds) {
    // If a structural change is already pending for this window, skip —
    // the full refresh will include this tab's changes.
    if (structuralQueue.has(targetId)) continue;

    let tabIds = contentQueue.get(targetId);
    if (!tabIds) {
      tabIds = new Set();
      contentQueue.set(targetId, tabIds);
    }
    tabIds.add(tabId);
  }

  scheduleQueueProcessing();
}

ipcMain.handle("tabs:switch-to-tab", async (event, tabId: number) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  const tab = tabsController.getTabById(tabId);
  if (!tab) return false;

  if (isTabSyncEnabled()) {
    let switched = false;
    await runTabSyncMutation(async () => {
      if (window.destroyed) return;
      const currentTab = tabsController.getTabById(tabId);
      if (!currentTab || currentTab.isDestroyed) return;

      // In sync mode, the tab may currently live in a different window.
      // Move it (and its group) to the requesting window before activating.
      // This also creates a screenshot placeholder in the old window.
      if (currentTab.getWindow().id !== window.id) {
        await moveTabOrGroupToWindow(currentTab, window);
      }

      // Re-validate after the async move: the tab or window may have been
      // destroyed, or the move may have silently bailed out.
      const movedTab = tabsController.getTabById(tabId);
      if (!movedTab || movedTab.isDestroyed) return;
      if (window.destroyed) return;
      if (movedTab.getWindow().id !== window.id) return;

      tabsController.setActiveTab(movedTab);
      switched = true;
    });
    return switched;
  }

  tabsController.setActiveTab(tab);
  return true;
});

ipcMain.handle(
  "tabs:new-tab",
  async (event, url?: string, isForeground?: boolean, spaceId?: string, typedFromAddressBar?: boolean) => {
    const webContents = event.sender;
    const window =
      browserWindowsController.getWindowFromWebContents(webContents) || browserWindowsController.getWindows()[0];
    if (!window) return;

    if (!spaceId) {
      const currentSpace = window.currentSpaceId;
      if (!currentSpace) return;

      spaceId = currentSpace;
    }

    if (!spaceId) return;

    const space = await spacesController.get(spaceId);
    if (!space) return;

    const tab = await tabsController.createTab(window.id, space.profileId, spaceId, undefined, {
      url: url || undefined,
      typedNavigation: typedFromAddressBar === true
    });

    if (isForeground) {
      tabsController.setActiveTab(tab);
    }
    return true;
  }
);

ipcMain.handle("tabs:close-tab", async (event, tabId: number) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  const tab = tabsController.getTabById(tabId);
  if (!tab) return false;

  tab.destroy();
  return true;
});

ipcMain.handle("tabs:disable-picture-in-picture", async (event, goBackToTab: boolean) => {
  const sender = event.sender;
  const tab = tabsController.getTabByWebContents(sender);
  if (!tab) return false;

  const disabled = tabsController.disablePictureInPicture(tab.id, goBackToTab);
  return disabled;
});

ipcMain.handle("tabs:set-tab-muted", async (_event, tabId: number, muted: boolean) => {
  const tab = tabsController.getTabById(tabId);
  if (!tab) return false;

  tab.webContents?.setAudioMuted(muted);

  // No event for mute state change, so we need to update the tab state manually
  tab.updateTabState();
  return true;
});

ipcMain.handle("tabs:move-tab", async (event, tabId: number, newPosition: number) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  const tab = tabsController.getTabById(tabId);
  if (!tab) return false;

  let targetTabs: Tab[] = [tab];

  const tabGroup = tabsController.getTabGroupByTabId(tab.id);
  if (tabGroup) {
    targetTabs = tabGroup.tabs;
  }

  for (const targetTab of targetTabs) {
    targetTab.updateStateProperty("position", newPosition);
  }

  // Normalize positions after reorder to prevent drift
  tabsController.normalizePositions(window.id, tab.spaceId);

  return true;
});

ipcMain.handle("tabs:move-tab-to-window-space", async (event, tabId: number, spaceId: string, newPosition?: number) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  const tab = tabsController.getTabById(tabId);
  if (!tab) return false;

  const space = await spacesController.get(spaceId);
  if (!space) return false;

  // Capture source space before move (for normalizing after)
  const sourceSpaceId = tab.spaceId;

  // Collect all tabs to move (includes tab group members)
  let targetTabs: Tab[] = [tab];
  const tabGroup = tabsController.getTabGroupByTabId(tab.id);
  if (tabGroup) {
    targetTabs = tabGroup.tabs;
  }

  // Move all tabs in the group to the new space
  for (const targetTab of targetTabs) {
    targetTab.setSpace(spaceId);
    targetTab.setWindow(window);

    if (newPosition !== undefined) {
      targetTab.updateStateProperty("position", newPosition);
    }
  }

  // Normalize positions in both source and target spaces
  tabsController.normalizePositions(window.id, spaceId);
  if (sourceSpaceId !== spaceId) {
    tabsController.normalizePositions(window.id, sourceSpaceId);
  }

  tabsController.setActiveTab(tab);
  return true;
});

ipcMain.on("tabs:show-context-menu", (event, tabId: number) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return;

  const tab = tabsController.getTabById(tabId);
  if (!tab) return;

  const isTabVisible = tab.visible;
  const hasURL = !!tab.url;
  const lifecycleManager = tabsController.getLifecycleManager(tabId);

  const contextMenu = new Menu();

  contextMenu.append(
    new MenuItem({
      label: "Copy URL",
      enabled: hasURL,
      click: () => {
        const url = tab.url;
        if (!url) return;
        clipboard.writeText(url);
      }
    })
  );

  contextMenu.append(
    new MenuItem({
      type: "separator"
    })
  );

  contextMenu.append(
    new MenuItem({
      label: isTabVisible ? "Cannot put active tab to sleep" : tab.asleep ? "Wake Tab" : "Put Tab to Sleep",
      enabled: !isTabVisible,
      click: () => {
        if (!lifecycleManager) return;
        if (tab.asleep) {
          lifecycleManager.wakeUp();
          tabsController.setActiveTab(tab);
        } else {
          lifecycleManager.putToSleep();
        }
      }
    })
  );

  contextMenu.append(
    new MenuItem({
      label: "Close Tab",
      click: () => {
        tab.destroy();
      }
    })
  );

  contextMenu.append(
    new MenuItem({
      type: "separator"
    })
  );

  const recentlyClosed = recentlyClosedManager.getAll();
  const hasRecentlyClosed = recentlyClosed.length > 0;
  const mostRecent = hasRecentlyClosed ? recentlyClosed[0] : null;
  const mostRecentTitle = mostRecent?.tabData.title;
  const mostRecentTruncatedTitle =
    mostRecentTitle && mostRecentTitle.length > 35
      ? mostRecentTitle.slice(0, 35).trim() + "..."
      : mostRecentTitle?.trim();

  contextMenu.append(
    new MenuItem({
      label: mostRecentTruncatedTitle ? `Reopen Closed Tab (${mostRecentTruncatedTitle})` : "Reopen Closed Tab",
      enabled: hasRecentlyClosed,
      click: () => {
        if (!mostRecent) return;
        restoreRecentlyClosedTabInWindow(window, mostRecent.tabData.uniqueId).catch((error) => {
          console.error("Failed to restore most recent closed tab:", error);
        });
      }
    })
  );

  contextMenu.popup({
    window: window.browserWindow
  });
});

// --- Recently Closed Tabs ---

ipcMain.handle("tabs:get-recently-closed", async () => {
  return recentlyClosedManager.getAll();
});

ipcMain.handle("tabs:restore-recently-closed", async (event, uniqueId: string) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  return restoreRecentlyClosedTabInWindow(window, uniqueId);
});

ipcMain.handle("tabs:clear-recently-closed", async () => {
  recentlyClosedManager.clear();
  return true;
});

// --- Batch Tab Move ---

ipcMain.handle("tabs:batch-move-tabs", async (event, tabIds: number[], spaceId: string, newPositionStart?: number) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  const space = await spacesController.get(spaceId);
  if (!space) return false;

  for (let i = 0; i < tabIds.length; i++) {
    const tab = tabsController.getTabById(tabIds[i]);
    if (!tab) continue;

    tab.setSpace(spaceId);
    tab.setWindow(window);

    if (newPositionStart !== undefined) {
      tab.updateStateProperty("position", newPositionStart + i);
    }
  }

  // Normalize positions after batch reorder to prevent drift
  tabsController.normalizePositions(window.id, spaceId);

  return true;
});
