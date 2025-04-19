import { SLEEP_MODE_URL } from "@/browser/tabs/tab";
import { browser } from "@/index";
import { ipcMain } from "electron";

ipcMain.on("navigation:go-to", (event, url: string, tabId?: number) => {
  const webContents = event.sender;
  const window = browser?.getWindowFromWebContents(webContents);
  if (!window) return false;

  const currentSpace = window.getCurrentSpace();
  if (!currentSpace) return false;

  const tab = tabId ? browser?.getTabFromId(tabId) : browser?.tabs.getFocusedTab(window.id, currentSpace);
  if (!tab) return false;

  tab.loadURL(url);
  return true;
});

ipcMain.on("navigation:stop-loading-tab", (event, tabId: number) => {
  const tab = browser?.getTabFromId(tabId);
  if (!tab) return;

  tab.webContents?.stop();
});

ipcMain.on("navigation:reload-tab", (event, tabId: number) => {
  const tab = browser?.getTabFromId(tabId);
  if (!tab) return;

  tab.webContents?.reload();
});

ipcMain.handle("navigation:get-tab-status", async (event, tabId: number) => {
  const tab = browser?.getTabFromId(tabId);
  if (!tab) return null;

  const tabWebContents = tab.webContents;
  const navigationHistory = tabWebContents?.navigationHistory;
  if (!navigationHistory) return null;

  const entries = navigationHistory.getAllEntries().filter((entry) => entry.url !== SLEEP_MODE_URL);
  const activeIndex = navigationHistory.getActiveIndex();
  const canGoBack = navigationHistory.canGoBack() && activeIndex - 1 >= 0;
  const canGoForward = navigationHistory.canGoForward() && activeIndex + 1 < entries.length;

  return {
    navigationHistory: entries,
    activeIndex,
    canGoBack,
    canGoForward
  };
});

ipcMain.on("navigation:go-to-entry", (event, tabId: number, index: number) => {
  const tab = browser?.getTabFromId(tabId);
  if (!tab) return;

  return tab.webContents?.navigationHistory?.goToIndex(index);
});
