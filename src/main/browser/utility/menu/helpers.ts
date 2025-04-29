import { getFocusedWindow, WindowData, WindowType } from "@/modules/windows";
import { Browser } from "@/browser/browser";
import { WebContents } from "electron";

export const getFocusedWindowData = () => {
  const winData = getFocusedWindow();
  if (!winData) return null;
  return winData;
};

export const getFocusedBrowserWindowData = () => {
  const winData = getFocusedWindowData();
  if (!winData) return null;

  if (winData.type !== WindowType.BROWSER) {
    return null;
  }

  return winData;
};

export const getTab = (browser: Browser, winData: WindowData) => {
  if (winData.type !== WindowType.BROWSER) {
    return null;
  }

  const window = winData.tabbedBrowserWindow;
  if (!window) return null;

  const windowId = window.id;

  const spaceId = window.getCurrentSpace();
  if (!spaceId) return null;

  const tab = browser.tabs.getFocusedTab(windowId, spaceId);
  if (!tab) return null;
  return tab;
};

export const getTabFromFocusedWindow = (browser: Browser) => {
  const winData = getFocusedWindowData();
  if (!winData) return null;
  return getTab(browser, winData);
};

export const getTabWc = (browser: Browser, winData: WindowData): WebContents | null => {
  const tab = getTab(browser, winData);
  if (!tab) return null;
  return tab.webContents;
};

export const getTabWcFromFocusedWindow = (browser: Browser): WebContents | null => {
  const winData = getFocusedWindowData();
  if (!winData) return null;
  return getTabWc(browser, winData);
};
