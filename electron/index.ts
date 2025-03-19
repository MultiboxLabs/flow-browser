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

  // IPC Handlers //
  // This is not exposed through the Chrome Extension API, so we need to handle it here.
  ipcMain.on("stop-loading-tab", (event, tabId: number) => {
    const webContents = event.sender;
    const window = browser.getWindowFromWebContents(webContents);
    if (!window) return;

    const tab = window.tabs.get(tabId);
    if (!tab) return;

    tab.webContents.stop();
  });

  // This is not exposed through the Chrome Extension API either, so we need to handle it here.
  ipcMain.handle("get-tab-navigation-status", async (event, tabId: number) => {
    const webContents = event.sender;
    const window = browser.getWindowFromWebContents(webContents);
    if (!window) return null;

    const tab = window.tabs.get(tabId);
    if (!tab) return null;

    return {
      canGoBack: tab.webContents.navigationHistory.canGoBack(),
      canGoForward: tab.webContents.navigationHistory.canGoForward()
    };
  });
}
