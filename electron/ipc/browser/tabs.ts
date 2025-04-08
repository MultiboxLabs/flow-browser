import { Tab, TabManager } from "@/browser/tabs";
import { TabbedBrowserWindow } from "@/browser/window";
import { browser } from "@/index";
import { ipcMain } from "electron";

type TabData = {
  id: number;
  profileId: string;
  spaceId: string;
  active: boolean;
};

function getTabData(profileId: string, tab: Tab): TabData {
  return {
    id: tab.id,
    profileId: profileId,
    spaceId: tab.spaceId,
    active: tab.active
  };
}

function getTabDatasFromWindow(window: TabbedBrowserWindow) {
  const tabManagers = window.getTabManagers();
  const tabs: TabData[] = [];
  for (const [profileId, tabManager] of tabManagers) {
    const profileTabs = tabManager.getTabs();
    for (const tab of profileTabs) {
      tabs.push(getTabData(profileId, tab));
    }
  }
  return tabs;
}

// IPC Handlers //
ipcMain.handle("tabs:get-data", async (event) => {
  const webContents = event.sender;
  const window = browser?.getWindowFromWebContents(webContents);
  if (!window) return null;

  return {
    tabs: getTabDatasFromWindow(window),
    active: window.getTabManagers().map(([profileId, tabManager]) => ({
      profileId,
      ...tabManager.getActiveData()
    })),
    focusedTabId: window.getTabManagers().map(([profileId, tabManager]) => ({
      profileId,
      tabId: tabManager.focusedTabId
    }))
  };
});
