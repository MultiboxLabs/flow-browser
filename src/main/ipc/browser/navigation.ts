import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { ipcMain } from "electron";

ipcMain.on("navigation:go-to", (event, url: string, tabId?: number) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  const currentSpace = window.currentSpaceId;
  if (!currentSpace) return false;

  const tab = tabId ? tabsController.getTabById(tabId) : tabsController.getFocusedTab(window.id, currentSpace);
  if (!tab) return false;

  tab.loadURL(url);
  return true;
});

ipcMain.on("navigation:stop-loading-tab", (_event, tabId: number) => {
  const tab = tabsController.getTabById(tabId);
  if (!tab) return;

  tab.webContents?.stop();
});

ipcMain.on("navigation:reload-tab", (_event, tabId: number) => {
  const tab = tabsController.getTabById(tabId);
  if (!tab) return;

  tab.webContents?.reload();
});

ipcMain.handle("navigation:get-tab-status", async (_event, tabId: number) => {
  const tab = tabsController.getTabById(tabId);
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

ipcMain.on("navigation:go-to-entry", (_event, tabId: number, index: number) => {
  const tab = tabsController.getTabById(tabId);
  if (!tab) return;

  return tab.webContents?.navigationHistory?.goToIndex(index);
});
