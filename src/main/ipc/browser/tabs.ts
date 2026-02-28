import { BaseTabGroup } from "@/controllers/tabs-controller/tab-groups";
import { spacesController } from "@/controllers/spaces-controller";
import { clipboard, ipcMain, Menu, MenuItem } from "electron";
import { PersistedTabGroupData, TabData, WindowActiveTabIds, WindowFocusedTabIds } from "~/types/tabs";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { Tab } from "@/controllers/tabs-controller/tab";
import { tabsController } from "@/controllers/tabs-controller";
import { serializeTabForRenderer, serializeTabGroupForRenderer } from "@/saving/tabs/serialization";
import { recentlyClosedManager } from "@/saving/tabs/recently-closed";
import { GlanceTabGroup } from "@/controllers/tabs-controller/tab-groups/glance";

/**
 * Attempts to restore a tab's group membership after it has been recreated.
 *
 * If the tab's original group still exists (other members survived), the tab
 * is added back to it. Otherwise, if other tabs from the same group are still
 * alive (but the group was destroyed), a new group is created with those tabs
 * plus the restored tab. If only the restored tab remains, it stays standalone.
 */
function restoreTabGroupMembership(restoredTab: Tab, groupData?: PersistedTabGroupData): void {
  if (!groupData) return;

  // Check if other tabs from the original group are still alive
  const otherTabIds: number[] = [];
  for (const uniqueId of groupData.tabUniqueIds) {
    if (uniqueId === restoredTab.uniqueId) continue;
    // Find the live tab with this uniqueId
    for (const tab of tabsController.tabs.values()) {
      if (tab.uniqueId === uniqueId && !tab.isDestroyed) {
        otherTabIds.push(tab.id);
        break;
      }
    }
  }

  if (otherTabIds.length === 0) {
    // No other group members are alive — restore as standalone tab
    return;
  }

  // Check if the original group still exists (identified by having one of the other tabs in it)
  const existingGroup = tabsController.getTabGroupByTabId(otherTabIds[0]);
  if (existingGroup && existingGroup.mode === groupData.mode) {
    // The group survived — add the restored tab back into it
    existingGroup.addTab(restoredTab.id);

    // Restore glance front tab if applicable
    if (
      groupData.mode === "glance" &&
      groupData.glanceFrontTabUniqueId === restoredTab.uniqueId &&
      existingGroup instanceof GlanceTabGroup
    ) {
      existingGroup.setFrontTab(restoredTab.id);
    }
    return;
  }

  // The group was destroyed but other member tabs are still alive — recreate the group
  const allTabIds = [restoredTab.id, ...otherTabIds];
  if (allTabIds.length < 2) return;

  try {
    const newGroup = tabsController.createTabGroup(groupData.mode, allTabIds as [number, ...number[]]);

    // Restore glance front tab if applicable
    if (groupData.mode === "glance" && groupData.glanceFrontTabUniqueId) {
      const frontTab = [...tabsController.tabs.values()].find(
        (t) => t.uniqueId === groupData.glanceFrontTabUniqueId && !t.isDestroyed
      );
      if (frontTab && newGroup instanceof GlanceTabGroup) {
        newGroup.setFrontTab(frontTab.id);
      }
    }
  } catch (error) {
    console.error("Failed to restore tab group membership:", error);
    // Tab is already created — it will just remain ungrouped
  }
}

// IPC Handlers //
function getWindowTabsData(window: BrowserWindow) {
  const windowId = window.id;

  const tabs = tabsController.getTabsInWindow(windowId);
  const tabGroups = tabsController.getTabGroupsInWindow(windowId);

  // Filter out ephemeral tabs — they are managed by the pin grid and should
  // never appear in the sidebar tab list.
  const visibleTabs = tabs.filter((tab) => !tab.ephemeral);

  const tabDatas = visibleTabs.map((tab) => {
    const managers = tabsController.getTabManagers(tab.id);
    return serializeTabForRenderer(tab, managers?.lifecycle.preSleepState);
  });
  const tabGroupDatas = tabGroups.map((tabGroup) => serializeTabGroupForRenderer(tabGroup));

  const windowProfiles: string[] = [];
  const windowSpaces: string[] = [];

  // Build space/profile sets from ALL tabs (including ephemeral) so that
  // focused/active tab maps include spaces whose only tab is ephemeral.
  // The `tabDatas` array (sidebar tab list) still uses `visibleTabs` above.
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
      if (!tab || tab.ephemeral) continue;

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
 */
export function windowTabsChanged(windowId: number) {
  structuralQueue.add(windowId);
  scheduleQueueProcessing();
}

/**
 * Enqueue a content-only change for a single tab.
 * If no structural change occurs before processing, only the changed tabs'
 * data will be serialized and sent — much cheaper than a full refresh.
 */
export function windowTabContentChanged(windowId: number, tabId: number) {
  // If a structural change is already pending for this window, skip —
  // the full refresh will include this tab's changes.
  if (structuralQueue.has(windowId)) return;

  let tabIds = contentQueue.get(windowId);
  if (!tabIds) {
    tabIds = new Set();
    contentQueue.set(windowId, tabIds);
  }
  tabIds.add(tabId);

  scheduleQueueProcessing();
}

ipcMain.handle("tabs:switch-to-tab", async (event, tabId: number) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  const tab = tabsController.getTabById(tabId);
  if (!tab) return false;

  tabsController.setActiveTab(tab);
  return true;
});

ipcMain.handle("tabs:new-tab", async (event, url?: string, isForeground?: boolean, spaceId?: string) => {
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
    url: url || undefined
  });

  if (isForeground) {
    tabsController.setActiveTab(tab);
  }
  return true;
});

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

  // Reopen Closed Tab — async check for recently closed tabs
  recentlyClosedManager.getAll().then((recentlyClosed) => {
    const hasRecentlyClosed = recentlyClosed.length > 0;
    const mostRecent = hasRecentlyClosed ? recentlyClosed[0] : null;

    contextMenu.append(
      new MenuItem({
        label: mostRecent ? `Reopen Closed Tab (${mostRecent.tabData.title})` : "Reopen Closed Tab",
        enabled: hasRecentlyClosed,
        click: () => {
          if (!mostRecent) return;
          recentlyClosedManager.restore(mostRecent.tabData.uniqueId).then((result) => {
            if (!result) return;
            const { tabData, tabGroupData } = result;

            spacesController.get(tabData.spaceId).then(async (space) => {
              if (!space) return;
              const restoredTab = await tabsController.createTab(
                window.id,
                space.profileId,
                tabData.spaceId,
                undefined,
                {
                  uniqueId: tabData.uniqueId,
                  window,
                  position: tabData.position,
                  title: tabData.title,
                  faviconURL: tabData.faviconURL ?? undefined,
                  navHistory: tabData.navHistory,
                  navHistoryIndex: tabData.navHistoryIndex
                }
              );

              restoreTabGroupMembership(restoredTab, tabGroupData);
              tabsController.setActiveTab(restoredTab);
            });
          });
        }
      })
    );

    contextMenu.popup({
      window: window.browserWindow
    });
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

  const result = await recentlyClosedManager.restore(uniqueId);
  if (!result) return false;
  const { tabData, tabGroupData } = result;

  // Restore the tab into the current window and its original space
  const space = await spacesController.get(tabData.spaceId);
  if (!space) return false;

  const tab = await tabsController.createTab(window.id, space.profileId, tabData.spaceId, undefined, {
    uniqueId: tabData.uniqueId,
    window,
    position: tabData.position,
    title: tabData.title,
    faviconURL: tabData.faviconURL ?? undefined,
    navHistory: tabData.navHistory,
    navHistoryIndex: tabData.navHistoryIndex
  });

  restoreTabGroupMembership(tab, tabGroupData);
  tabsController.setActiveTab(tab);
  return true;
});

ipcMain.handle("tabs:clear-recently-closed", async () => {
  await recentlyClosedManager.clear();
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
