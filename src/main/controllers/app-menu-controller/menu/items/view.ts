import { MenuItemConstructorOptions } from "electron";
import { getFocusedBrowserWindow, getFocusedWindow, getTab, getTabWcFromFocusedWindow } from "../helpers";
import { toggleSidebar } from "@/ipc/browser/interface";
import { getCurrentShortcut } from "@/modules/shortcuts";
import { browserWindowsManager } from "@/controllers/windows-controller";
import { getSettingValueById } from "@/saving/settings";

export function menuCloseTab() {
  const window = getFocusedWindow();
  if (!window) return;

  if (!browserWindowsManager.isInstanceOf(window)) {
    window.close();
    return;
  }

  if (window.omnibox.isVisible()) {
    window.omnibox.hide();
  } else {
    const tab = getTab(window);
    if (tab) {
      tab.destroy();
    } else {
      // No more tabs, close the window
      window.close();
    }
  }
}

export const createViewMenu = (): MenuItemConstructorOptions => {
  const rippleEnabled = getSettingValueById("rippleEnabled") === true;

  return {
    label: "View",
    submenu: [
      {
        label: "Toggle Sidebar",
        accelerator: getCurrentShortcut("browser.toggleSidebar"),
        click: () => {
          const window = getFocusedBrowserWindow();
          if (window) {
            toggleSidebar(window);
          }
        }
      },
      ...(rippleEnabled
        ? [
            {
              label: "Toggle Ripple Sidebar",
              accelerator: getCurrentShortcut("ripple.toggleSidebar"),
              click: () => {
                const window = getFocusedBrowserWindow();
                if (window) {
                  window.sendMessageToCoreWebContents("ripple:on-toggle-sidebar");
                }
              }
            }
          ]
        : []),
      { type: "separator" as const },
      {
        label: "Reload",
        accelerator: getCurrentShortcut("tab.reload"),
        click: () => {
          const tabWc = getTabWcFromFocusedWindow();
          if (!tabWc) return;
          tabWc.reload();
        }
      },
      {
        label: "Force Reload",
        accelerator: getCurrentShortcut("tab.forceReload"),
        click: () => {
          const tabWc = getTabWcFromFocusedWindow();
          if (!tabWc) return;
          tabWc.reloadIgnoringCache();
        }
      },
      {
        label: "Close Tab",
        accelerator: getCurrentShortcut("tab.close"),
        click: () => {
          menuCloseTab();
        }
      },
      {
        label: "Toggle Developer Tools",
        accelerator: getCurrentShortcut("tab.toggleDevTools"),
        click: () => {
          const tabWc = getTabWcFromFocusedWindow();
          if (!tabWc) return;
          tabWc.toggleDevTools();
        }
      },
      {
        label: "Find in Page",
        accelerator: getCurrentShortcut("tab.findInPage"),
        click: () => {
          const window = getFocusedBrowserWindow();
          if (window) {
            window.sendMessageToCoreWebContents("find-in-page:toggle");
          }
        }
      },
      { type: "separator" as const },
      { role: "resetZoom" as const },
      { role: "zoomIn" as const },
      { role: "zoomOut" as const },
      { type: "separator" as const },
      { role: "togglefullscreen" as const }
    ]
  };
};
