import { MenuItemConstructorOptions } from "electron";
import { Browser } from "@/browser/browser";
import { hideOmnibox, isOmniboxOpen } from "@/browser/components/omnibox";
import { WindowType } from "@/modules/windows";
import { getFocusedBrowserWindowData, getFocusedWindowData, getTab, getTabWcFromFocusedWindow } from "../helpers";
import { toggleSidebar } from "@/ipc/browser/interface";
import { getCurrentShortcut } from "@/modules/shortcuts";

export function menuCloseTab(browser: Browser) {
  const winData = getFocusedWindowData();
  if (!winData) return;

  if (winData.type !== WindowType.BROWSER) {
    if (winData.window.closable) {
      winData.window.close();
    }
    return;
  }

  const browserWindow = winData.window;
  if (browserWindow && isOmniboxOpen(browserWindow)) {
    hideOmnibox(browserWindow);
  } else {
    const tab = getTab(browser, winData);
    if (tab) {
      tab.destroy();
    } else {
      if (winData.window) {
        winData.window.close();
      }
    }
  }
}

export const createViewMenu = (browser: Browser): MenuItemConstructorOptions => ({
  label: "View",
  submenu: [
    {
      label: "Toggle Sidebar",
      accelerator: getCurrentShortcut("browser.toggleSidebar"),
      click: () => {
        const winData = getFocusedBrowserWindowData();
        if (!winData) return;
        if (winData.tabbedBrowserWindow) {
          toggleSidebar(winData.tabbedBrowserWindow);
        }
      }
    },
    { type: "separator" },
    {
      label: "Reload",
      accelerator: getCurrentShortcut("tab.reload"),
      click: () => {
        const tabWc = getTabWcFromFocusedWindow(browser);
        if (!tabWc) return;
        tabWc.reload();
      }
    },
    {
      label: "Force Reload",
      accelerator: getCurrentShortcut("tab.forceReload"),
      click: () => {
        const tabWc = getTabWcFromFocusedWindow(browser);
        if (!tabWc) return;
        tabWc.reloadIgnoringCache();
      }
    },
    {
      label: "Close Tab",
      accelerator: getCurrentShortcut("tab.close"),
      click: () => {
        menuCloseTab(browser);
      }
    },
    {
      label: "Toggle Developer Tools",
      accelerator: getCurrentShortcut("tab.toggleDevTools"),
      click: () => {
        const tabWc = getTabWcFromFocusedWindow(browser);
        if (!tabWc) return;
        tabWc.toggleDevTools();
      }
    },
    { type: "separator" },
    { role: "resetZoom" },
    { role: "zoomIn" },
    { role: "zoomOut" },
    { type: "separator" },
    { role: "togglefullscreen" }
  ]
});
