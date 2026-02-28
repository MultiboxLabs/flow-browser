import { MenuItemConstructorOptions } from "electron";
import { getFocusedBrowserWindow } from "../helpers";
import { openNewTab } from "@/ipc/app/new-tab";
import { getCurrentShortcut } from "@/modules/shortcuts";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";

export const createFileMenu = (): MenuItemConstructorOptions => ({
  label: "File",
  submenu: [
    {
      label: "New Tab",
      accelerator: getCurrentShortcut("tabs.new"),
      click: () => {
        const window = getFocusedBrowserWindow();
        if (!window) return;
        return openNewTab(window);
      }
    },
    {
      label: "New Window",
      accelerator: getCurrentShortcut("browser.newWindow"),
      click: () => {
        browserWindowsController.create();
      }
    },
    {
      type: "separator"
    },
    {
      label: "Toggle Command Palette",
      accelerator: getCurrentShortcut("navigation.toggleCommandPalette"),
      click: () => {
        const window = getFocusedBrowserWindow();
        if (!window) return;
        const omnibox = window.omnibox;
        if (omnibox.isVisible()) {
          omnibox.hide();
        } else {
          omnibox.show();
        }
      }
    },
    {
      type: "separator"
    },
    {
      label: "Close Window",
      accelerator: getCurrentShortcut("browser.closeWindow"),
      click: () => {
        const window = getFocusedBrowserWindow();
        if (!window) return;
        window.close();
      }
    }
  ]
});
