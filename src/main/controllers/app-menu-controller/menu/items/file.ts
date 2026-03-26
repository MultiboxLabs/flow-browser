import { MenuItemConstructorOptions } from "electron";
import { getFocusedBrowserWindow } from "../helpers";
import { openNewTab } from "@/ipc/app/new-tab";
import { getCurrentShortcut } from "@/modules/shortcuts";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { createIncognitoWindow } from "@/modules/incognito/windows";
import { FLAGS } from "@/modules/flags";
import { recentlyClosedManager } from "@/controllers/tabs-controller/recently-closed-manager";
import { restoreMostRecentClosedTabInWindow } from "@/controllers/tabs-controller/recently-closed";

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
      label: "Reopen Closed Tab",
      accelerator: getCurrentShortcut("tab.reopenClosed"),
      enabled: recentlyClosedManager.hasEntries(),
      click: () => {
        const window = getFocusedBrowserWindow();
        if (!window) return;
        void restoreMostRecentClosedTabInWindow(window).catch((error) => {
          console.error("Failed to restore most recent closed tab:", error);
        });
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
      label: "New Incognito Window",
      accelerator: getCurrentShortcut("browser.newIncognitoWindow"),
      enabled: FLAGS.INCOGNITO_ENABLED,
      click: () => {
        createIncognitoWindow().catch((error) => {
          console.error("Failed to create incognito window:", error);
        });
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
          omnibox.setBounds(null);
          omnibox.setOpenState({
            currentInput: "",
            openIn: "current"
          });
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
