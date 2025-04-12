import { Tab } from "@/browser/tabs/tab";
import { TabGroup } from "@/browser/tabs/tab-groups";
import { TabbedBrowserWindow } from "@/browser/window";
import { browser } from "@/index";
import { ipcMain } from "electron";
import { TabData, TabGroupData, WindowActiveTabIds } from "~/types/tabs";

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
    faviconURL: tab.faviconURL
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

  const focusedTabs: WindowActiveTabIds = {};
  const activeTabs: WindowActiveTabIds = {};

  for (const spaceId of windowSpaces) {
    const focusedTab = tabManager.getFocusedTab(windowId, spaceId);
    if (focusedTab) {
      focusedTabs[spaceId] = focusedTab.id;
    }

    const activeTab = tabManager.getActiveTab(windowId, spaceId);
    if (activeTab) {
      activeTabs[spaceId] = activeTab.id;
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

export function windowTabsChanged(windowId: number) {
  const window = browser?.getWindowById(windowId);
  if (!window) return;

  const data = getWindowTabsData(window);
  if (!data) return;

  for (const webContents of window.coreWebContents) {
    webContents.send("tabs:on-data-changed", data);
  }
}
