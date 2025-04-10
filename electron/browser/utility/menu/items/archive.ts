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
        // Check if back navigation is possible before calling goBack
        if (tabWc.canGoBack()) {
          tabWc.goBack();
        }
      }
    },
    {
      label: "Go Forward",
      accelerator: "CmdOrCtrl+Right",
      click: () => {
        const tabWc = getTabWcFromFocusedWindow(browser);
        if (!tabWc) return;
        // Check if forward navigation is possible before calling goForward
        if (tabWc.canGoForward()) {
          tabWc.goForward();
        }
      }
    }
  ]
});
