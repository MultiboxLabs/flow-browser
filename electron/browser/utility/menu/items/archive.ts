import { MenuItemConstructorOptions } from "electron";
import { Browser } from "@/browser/browser";
import { getTabWcFromFocusedWindow } from "../helpers";

export const createArchiveMenu = (browser: Browser): MenuItemConstructorOptions => ({
  label: "Archive", // Consider renaming to "History" or "Navigation" if more appropriate
  submenu: [
    {
      label: "Go Back",
      accelerator: "CmdOrCtrl+Left",
      click: () => {
        const tabWc = getTabWcFromFocusedWindow(browser);
        if (!tabWc) return;

        const navigationHistory = tabWc.navigationHistory;
        // Check if back navigation is possible before calling goBack
        if (navigationHistory.canGoBack()) {
          navigationHistory.goBack();
        }
      }
    },
    {
      label: "Go Forward",
      accelerator: "CmdOrCtrl+Right",
      click: () => {
        const tabWc = getTabWcFromFocusedWindow(browser);
        if (!tabWc) return;

        const navigationHistory = tabWc.navigationHistory;
        // Check if forward navigation is possible before calling goForward
        if (navigationHistory.canGoForward()) {
          navigationHistory.goForward();
        }
      }
    }
  ]
});
