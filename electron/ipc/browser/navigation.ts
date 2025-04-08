import { browser } from "@/index";
import { ipcMain } from "electron";

ipcMain.on("navigation:stop-loading-tab", (event, tabId: number) => {
  const tab = browser?.getTabFromId(tabId);
  if (!tab) return;

  tab.webContents?.stop();
});

ipcMain.handle("navigation:get-tab-status", async (event, tabId: number) => {
  const tab = browser?.getTabFromId(tabId);
  if (!tab) return null;

  const tabWebContents = tab.webContents;
  const navigationHistory = tabWebContents?.navigationHistory;
  if (!navigationHistory) return null;

  return {
    navigationHistory: navigationHistory.getAllEntries(),
    activeIndex: navigationHistory.getActiveIndex(),
    canGoBack: navigationHistory.canGoBack(),
    canGoForward: navigationHistory.canGoForward()
  };
});

ipcMain.on("navigation:go-to-entry", (event, tabId: number, index: number) => {
  const tab = browser?.getTabFromId(tabId);
  if (!tab) return;

  return tab.webContents?.navigationHistory?.goToIndex(index);
});
