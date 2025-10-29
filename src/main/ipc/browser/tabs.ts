import { BaseTabGroup, TabGroup } from "@/controllers/tabs-controller/tab-groups";
import { spacesController } from "@/controllers/spaces-controller";
import { clipboard, ipcMain, Menu, MenuItem } from "electron";
import { TabData, TabGroupData, WindowActiveTabIds, WindowFocusedTabIds } from "~/types/tabs";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { Tab } from "@/controllers/tabs-controller/tab";
import { tabsController } from "@/controllers/tabs-controller";

export function getTabData(tab: Tab): TabData {
  return {
    id: tab.id,
    uniqueId: tab.uniqueId,
    createdAt: tab.createdAt,
    lastActiveAt: tab.lastActiveAt,
    position: tab.position,

    profileId: tab.profileId,
    spaceId: tab.spaceId,
    windowId: tab.getWindow().id,

    title: tab.title,
    url: tab.url,
    isLoading: tab.isLoading,
    audible: tab.audible,
    muted: tab.muted,
    fullScreen: tab.fullScreen,
    isPictureInPicture: tab.isPictureInPicture,
    faviconURL: tab.faviconURL,
    asleep: tab.asleep,

    navHistory: tab.navHistory,
    navHistoryIndex: tab.navHistoryIndex
  };
}

export function getTabGroupData(tabGroup: TabGroup): TabGroupData {
  return {
    id: tabGroup.id,
    mode: tabGroup.mode,
    profileId: tabGroup.profileId,
    spaceId: tabGroup.spaceId,
    tabIds: tabGroup.tabs.map((tab) => tab.id),
    glanceFrontTabId: tabGroup.mode === "glance" ? tabGroup.frontTabId : undefined,
    position: tabGroup.position
  };
}

// IPC Handlers //
function getWindowTabsData(window: BrowserWindow) {
  const windowId = window.id;

  const tabs = tabsController.getTabsInWindow(windowId);
  const tabGroups = tabsController.getTabGroupsInWindow(windowId);

  const tabDatas = tabs.map((tab) => getTabData(tab));
  const tabGroupDatas = tabGroups.map((tabGroup) => getTabGroupData(tabGroup));

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

const windowTabsChangedQueue: Set<number> = new Set();
let windowTabsChangedQueueTimeout: NodeJS.Timeout | null = null;

function processWindowTabsChangedQueue() {
  if (windowTabsChangedQueue.size === 0) return;

  for (const windowId of Array.from(windowTabsChangedQueue)) {
    const window = browserWindowsController.getWindowById(windowId);
    if (!window) continue;

    const data = getWindowTabsData(window);
    if (!data) continue;

    window.sendMessageToCoreWebContents("tabs:on-data-changed", data);
  }

  windowTabsChangedQueue.clear();
}

export function windowTabsChanged(windowId: number) {
  // A set is used to avoid duplicates
  windowTabsChangedQueue.add(windowId);

  if (windowTabsChangedQueueTimeout) {
    // Already processing the queue, do nothing.
    return;
  }

  // Process the queue every 50ms
  windowTabsChangedQueueTimeout = setTimeout(() => {
    processWindowTabsChangedQueue();
    windowTabsChangedQueueTimeout = null;
  }, 50);
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

  const tab = await tabsController.createTab(window.id, space.profileId, spaceId);

  if (url) {
    tab.loadURL(url);
  }

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

  tab.webContents.setAudioMuted(muted);

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

  tab.setSpace(spaceId);
  tab.setWindow(window);

  if (newPosition !== undefined) {
    tab.updateStateProperty("position", newPosition);
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
        if (tab.asleep) {
          tab.wakeUp();
          tabsController.setActiveTab(tab);
        } else {
          tab.putToSleep();
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

  contextMenu.popup({
    window: window.browserWindow
  });
});
