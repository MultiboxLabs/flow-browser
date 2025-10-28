import { tabsController } from "@/controllers/tabs-controller";
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

export const getTab = (window?: BaseWindow) => {
  if (!window) return null;
  if (!browserWindowsManager.isInstanceOf(window)) {
    return null;
  }

  const windowId = window.id;

  const spaceId = window.currentSpaceId;
  if (!spaceId) return null;

  const tab = tabsController.getFocusedTab(windowId, spaceId);
  if (!tab) return null;
  return tab;
};

export const getTabFromFocusedWindow = () => {
  const winData = getFocusedWindow();
  if (!winData) return null;
  return getTab(winData);
};

export const getTabWc = (window: BaseWindow): WebContents | null => {
  const tab = getTab(window);
  if (!tab) return null;
  return tab.webContents;
};

export const getTabWcFromFocusedWindow = (): WebContents | null => {
  const window = getFocusedWindow();
  if (!window) return null;
  return getTabWc(window);
};
