import { Tab } from "@/browser/tabs/tab";
import { BaseTabGroup, TabGroup } from "@/browser/tabs/tab-groups";
import { TabbedBrowserWindow } from "@/browser/window";
import { browser } from "@/index";
import { getSpace } from "@/sessions/spaces";
import { ipcMain } from "electron";
import { TabData, TabGroupData, WindowActiveTabIds, WindowFocusedTabIds } from "~/types/tabs";

function getTabData(tab: Tab): TabData {
  return {
    id: tab.id,
    profileId: tab.profileId,
    spaceId: tab.spaceId,
    title: tab.title,
    url: tab.url,
    isLoading: tab.isLoading,
    audible: tab.audible,
    muted: tab.muted,
    fullScreen: tab.fullScreen,
    isPictureInPicture: tab.isPictureInPicture,
    faviconURL: tab.faviconURL,
    asleep: tab.asleep,
    navHistory: tab.navHistory
  };
}

function getTabGroupData(tabGroup: TabGroup): TabGroupData {
  return {
    id: tabGroup.id,
    mode: tabGroup.mode,
    profileId: tabGroup.profileId,
    spaceId: tabGroup.spaceId,
    tabIds: tabGroup.tabs.map((tab) => tab.id),
    glanceFrontTabId: tabGroup.mode === "glance" ? tabGroup.frontTabId : undefined
  };
}

// IPC Handlers //
function getWindowTabsData(window: TabbedBrowserWindow) {
  const tabManager = browser?.tabs;
  if (!tabManager) return null;

  const windowId = window.id;

  const tabs = tabManager.getTabsInWindow(windowId);
  const tabGroups = tabManager.getTabGroupsInWindow(windowId);

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
    const focusedTab = tabManager.getFocusedTab(windowId, spaceId);
    if (focusedTab) {
      focusedTabs[spaceId] = focusedTab.id;
    }

    const activeTab = tabManager.getActiveTab(windowId, spaceId);
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
  const window = browser?.getWindowFromWebContents(webContents);
  if (!window) return null;

  return getWindowTabsData(window);
});

const windowTabsChangedQueue: Set<number> = new Set();
let windowTabsChangedQueueTimeout: NodeJS.Timeout | null = null;

function processWindowTabsChangedQueue() {
  if (windowTabsChangedQueue.size === 0) return;
  if (!browser) return;

  for (const windowId of Array.from(windowTabsChangedQueue)) {
    const window = browser.getWindowById(windowId);
    if (!window) continue;

    const data = getWindowTabsData(window);
    if (!data) continue;

    for (const webContents of window.coreWebContents) {
      webContents.send("tabs:on-data-changed", data);
    }
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
  const window = browser?.getWindowFromWebContents(webContents);
  if (!window) return false;

  const tabManager = browser?.tabs;
  if (!tabManager) return false;

  const tab = tabManager.getTabById(tabId);
  if (!tab) return false;

  tabManager.setActiveTab(tab);
  return true;
});

ipcMain.handle("tabs:new-tab", async (event, url?: string, isForeground?: boolean, spaceId?: string) => {
  const webContents = event.sender;
  const window = browser?.getWindowFromWebContents(webContents);
  if (!window) return;

  const tabManager = browser?.tabs;
  if (!tabManager) return;

  if (!spaceId) {
    const currentSpace = window.getCurrentSpace();
    if (!currentSpace) return;

    spaceId = currentSpace;
  }

  if (!spaceId) return;

  const space = await getSpace(spaceId);
  if (!space) return;

  const tab = await tabManager.createTab(window.id, space.profileId, space.id);

  if (url) {
    tab.loadURL(url);
  }

  if (isForeground) {
    tabManager.setActiveTab(tab);
  }
  return true;
});

ipcMain.handle("tabs:close-tab", async (event, tabId: number) => {
  const webContents = event.sender;
  const window = browser?.getWindowFromWebContents(webContents);
  if (!window) return false;

  const tabManager = browser?.tabs;
  if (!tabManager) return false;

  const tab = tabManager.getTabById(tabId);
  if (!tab) return false;

  tab.destroy();
  return true;
});

ipcMain.handle("tabs:disable-picture-in-picture", async (event) => {
  if (!browser) return false;

  const sender = event.sender;

  const tab = browser.tabs.getTabByWebContents(sender);
  if (!tab) return false;

  const disabled = browser.tabs.disablePictureInPicture(tab.id);
  return disabled;
});
