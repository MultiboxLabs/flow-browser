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

// IPC Handlers //
ipcMain.handle("tabs:get-data", async (event) => {
  const webContents = event.sender;
  const window = browser?.getWindowFromWebContents(webContents);
  if (!window) return null;

  const tabManager = browser?.tabs;
  if (!tabManager) return null;

  const tabs = tabManager.getTabsInWindow(window.id);
  const tabGroups = tabManager.getTabGroupsInWindow(window.id);

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
