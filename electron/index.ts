import { app, BrowserWindow, ipcMain } from "electron";
import { Browser } from "./browser/main";

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  const browser = new Browser();

  app.on("second-instance", (_event, _commandLine, _workingDirectory, _additionalData) => {
    // Someone tried to run a second instance, we should focus our window.
    const window = browser.getWindows()[0];
    if (window) {
      window.getBrowserWindow().focus();
    }
  });

  // IPC Handlers for actions not exposed through the Chrome Extension API //
  ipcMain.on("stop-loading-tab", (event, tabId: number) => {
    const webContents = event.sender;
    const window = browser.getWindowFromWebContents(webContents);
    if (!window) return;

    const tab = window.tabs.get(tabId);
    if (!tab) return;

    tab.webContents.stop();
  });

  ipcMain.handle("get-tab-navigation-status", async (event, tabId: number) => {
    const webContents = event.sender;
    const window = browser.getWindowFromWebContents(webContents);
    if (!window) return null;

    const tab = window.tabs.get(tabId);
    if (!tab) return null;

    const tabWebContents = tab.webContents;
    const navigationHistory = tabWebContents.navigationHistory;

    return {
      navigationHistory: navigationHistory.getAllEntries(),
      activeIndex: navigationHistory.getActiveIndex(),
      canGoBack: navigationHistory.canGoBack(),
      canGoForward: navigationHistory.canGoForward()
    };
  });

  ipcMain.on("go-to-navigation-entry", (event, tabId: number, index: number) => {
    const webContents = event.sender;
    const window = browser.getWindowFromWebContents(webContents);
    if (!window) return;

    const tab = window.tabs.get(tabId);
    if (!tab) return;

    return tab.webContents.navigationHistory.goToIndex(index);
  });
}
