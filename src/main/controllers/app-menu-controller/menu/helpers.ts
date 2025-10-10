import { Browser } from "@/browser/browser";
import { browserWindowsManager, windowsController } from "@/controllers/windows-controller";
import { BaseWindow } from "@/controllers/windows-controller/types";
import { WebContents } from "electron";

export const getFocusedWindow = () => {
  return windowsController.getFocused();
};

export const getFocusedBrowserWindow = () => {
  const window = getFocusedWindow();

  if (!window) return null;
  if (!browserWindowsManager.isInstanceOf(window)) {
    return null;
  }

  return window;
};

export const getTab = (browser: Browser, window?: BaseWindow) => {
  if (!window) return null;
  if (!browserWindowsManager.isInstanceOf(window)) {
    return null;
  }

  const windowId = window.id;

  const spaceId = window.currentSpaceId;
  if (!spaceId) return null;

  const tab = browser.tabs.getFocusedTab(windowId, spaceId);
  if (!tab) return null;
  return tab;
};

export const getTabFromFocusedWindow = (browser: Browser) => {
  const winData = getFocusedWindow();
  if (!winData) return null;
  return getTab(browser, winData);
};

export const getTabWc = (browser: Browser, window: BaseWindow): WebContents | null => {
  const tab = getTab(browser, window);
  if (!tab) return null;
  return tab.webContents;
};

export const getTabWcFromFocusedWindow = (browser: Browser): WebContents | null => {
  const window = getFocusedWindow();
  if (!window) return null;
  return getTabWc(browser, window);
};
