import { MenuItemConstructorOptions } from "electron";
import { Browser } from "@/browser/browser";
import { getFocusedBrowserWindowData } from "../helpers";
import { openNewTab } from "@/ipc/app/new-tab";
import { getCurrentShortcut } from "@/modules/shortcuts";

export const createFileMenu = (browser: Browser): MenuItemConstructorOptions => ({
  label: "File",
  submenu: [
    {
      label: "New Tab",
      accelerator: getCurrentShortcut("tabs.new"),
      click: () => {
        const winData = getFocusedBrowserWindowData();
        if (!winData) return;

        const tabbedBrowserWindow = winData.tabbedBrowserWindow;
        if (!tabbedBrowserWindow) return;

        return openNewTab(tabbedBrowserWindow);
      }
    },
    {
      label: "New Window",
      accelerator: getCurrentShortcut("browser.newWindow"),
      click: () => {
        browser.createWindow();
      }
    }
  ]
});
