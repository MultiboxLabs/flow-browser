import { MenuItemConstructorOptions } from "electron";
import { Browser } from "@/browser/browser";
import { hideOmnibox, isOmniboxOpen } from "@/browser/components/omnibox";
import { WindowType } from "@/modules/windows";
import { getFocusedBrowserWindowData, getFocusedWindowData, getTab, getTabWcFromFocusedWindow } from "../helpers";
import { toggleSidebar } from "@/ipc/browser/interface";

const isMac = process.platform === "darwin";

export const createViewMenu = (browser: Browser): MenuItemConstructorOptions => ({
  label: "View",
  submenu: [
    {
      label: "Toggle Sidebar",
      accelerator: "CmdOrCtrl+B",
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
      accelerator: "CmdOrCtrl+R",
      click: () => {
        const tabWc = getTabWcFromFocusedWindow(browser);
        if (!tabWc) return;
        tabWc.reload();
      }
    },
    {
      label: "Force Reload",
      accelerator: "Shift+CmdOrCtrl+R",
      click: () => {
        const tabWc = getTabWcFromFocusedWindow(browser);
        if (!tabWc) return;
        tabWc.reloadIgnoringCache();
      }
    },
    {
      label: "Close Tab",
      accelerator: "CmdOrCtrl+W",
      click: () => {
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
    },
    {
      label: "Toggle Developer Tools",
      accelerator: isMac ? "Alt+Command+I" : "Ctrl+Shift+I",
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
