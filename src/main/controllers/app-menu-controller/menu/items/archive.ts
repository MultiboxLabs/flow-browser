import { MenuItemConstructorOptions } from "electron";
import { getTabWcFromFocusedWindow } from "../helpers";
import { getCurrentShortcut } from "@/modules/shortcuts";

export const createArchiveMenu = (): MenuItemConstructorOptions => ({
  label: "Archive", // Consider renaming to "History" or "Navigation" if more appropriate
  submenu: [
    {
      label: "Go Back",
      accelerator: getCurrentShortcut("navigation.goBack"),
      click: () => {
        const tabWc = getTabWcFromFocusedWindow();
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
      accelerator: getCurrentShortcut("navigation.goForward"),
      click: () => {
        const tabWc = getTabWcFromFocusedWindow();
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
