import { Tab } from "@/browser/tabs/tab";
import { TabGroup } from "@/browser/tabs/tab-groups";
import { TabbedBrowserWindow } from "@/browser/window";
import { browser } from "@/index";
import { ipcMain } from "electron";
import { TabData, TabGroupData } from "~/types/tabs";

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

  const tabs = tabManager.getTabsInWindow(window.id);
  const tabGroups = tabManager.getTabGroupsInWindow(window.id);

  const tabDatas = tabs.map((tab) => getTabData(tab));
  const tabGroupDatas = tabGroups.map((tabGroup) => getTabGroupData(tabGroup));

  return {
    tabs: tabDatas,
    tabGroups: tabGroupDatas
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
