import { clipboard, Menu, type WebContents, type MenuItem, type MenuItemConstructorOptions } from "electron";
import { Browser } from "./browser";
import { hideOmnibox, isOmniboxOpen, loadOmnibox, setOmniboxBounds, showOmnibox } from "@/browser/omnibox";
import { settings } from "@/settings/main";
import { getFocusedWindow, WindowData, WindowType } from "@/modules/windows";
import { getCurrentNewTabMode } from "@/saving/settings";

export function toggleSidebar(webContents: WebContents) {
  webContents.send("toggle-sidebar");
}

export const setupMenu = (browser: Browser) => {
  const isMac = process.platform === "darwin";

  const getFocusedWindowData = () => {
    const winData = getFocusedWindow();
    if (!winData) return null;
    return winData;
  };
  const getFocusedBrowserWindowData = () => {
    const winData = getFocusedWindowData();
    if (!winData) return null;

    if (winData.type !== WindowType.BROWSER) {
      return null;
    }

    return winData;
  };

  const getTab = (winData: WindowData) => {
    if (winData.type !== WindowType.BROWSER) {
      return null;
    }

    const tab = winData.tabbedBrowserWindow?.getFocusedTab();
    if (!tab) return null;
    return tab;
  };
  const getTabFromFocusedWindow = () => {
    const winData = getFocusedWindowData();
    if (!winData) return null;
    return getTab(winData);
  };

  const getTabWc = (winData: WindowData) => {
    const tab = getTab(winData);
    if (!tab) return null;
    return tab.webContents;
  };
  const getTabWcFromFocusedWindow = () => {
    const winData = getFocusedWindowData();
    if (!winData) return null;
    return getTabWc(winData);
  };

  const template: Array<MenuItemConstructorOptions | MenuItem> = [
    ...(isMac
      ? [
          {
            role: "appMenu" as const,
            submenu: [
              {
                role: "about"
              },
              { type: "separator" },
              {
                label: "Settings",
                click: () => {
                  settings.show();
                }
              },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "showAllTabs" },
              { type: "separator" },
              { role: "quit" }
            ]
          } as MenuItemConstructorOptions
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Tab",
          accelerator: "CmdOrCtrl+T",
          click: () => {
            const winData = getFocusedBrowserWindowData();
            if (!winData) return;

            const browserWindow = winData.window;
            const win = winData.tabbedBrowserWindow;

            // Open omnibox
            if (getCurrentNewTabMode() === "omnibox") {
              if (isOmniboxOpen(browserWindow)) {
                hideOmnibox(browserWindow);
              } else {
                loadOmnibox(browserWindow, null);
                setOmniboxBounds(browserWindow, null);
                showOmnibox(browserWindow);
              }
            } else {
              // Create new tab
              win?.tabs.create();
            }
          }
        },
        {
          label: "New Window",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            browser.createWindow();
          }
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        {
          label: "Copy URL",
          accelerator: "CmdOrCtrl+Shift+C",
          click: () => {
            const winData = getFocusedWindowData();
            if (!winData) return;

            const tabWc = getTabWc(winData);
            if (!tabWc) return;

            const url = tabWc.getURL();
            if (!url) return;

            clipboard.writeText(url);
            // TODO: Show notification to user that the URL has been copied
          }
        },
        { role: "paste" },
        { role: "pasteAndMatchStyle" },
        { role: "delete" },
        { role: "selectAll" }
      ]
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Sidebar",
          accelerator: "CmdOrCtrl+B",
          click: () => {
            const winData = getFocusedBrowserWindowData();
            if (!winData) return;
            toggleSidebar(winData.window.webContents);
          }
        },
        { type: "separator" },
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            const tabWc = getTabWcFromFocusedWindow();
            if (!tabWc) return;
            tabWc.reload();
          }
        },
        {
          label: "Force Reload",
          accelerator: "Shift+CmdOrCtrl+R",
          click: () => {
            const tabWc = getTabWcFromFocusedWindow();
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

            const win = winData.tabbedBrowserWindow;
            const browserWindow = win?.getBrowserWindow();
            if (browserWindow && isOmniboxOpen(browserWindow)) {
              // Close Omnibox
              hideOmnibox(browserWindow);
            } else {
              const tab = getTab(winData);
              if (tab) {
                // Close Tab
                tab.destroy();
              } else {
                // Close Window
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
            const tabWc = getTabWcFromFocusedWindow();
            if (!tabWc) return;

            tabWc.toggleDevTools();
          }
        },
        { type: "separator" },
        { role: "resetZoom" as const },
        { role: "zoomIn" as const },
        { role: "zoomOut" as const },
        { type: "separator" },
        { role: "togglefullscreen" as const }
      ]
    },
    {
      label: "Archive",
      submenu: [
        {
          label: "Go Back",
          accelerator: "CmdOrCtrl+Left",
          click: () => {
            const tabWc = getTabWcFromFocusedWindow();
            if (!tabWc) return;
            tabWc.navigationHistory.goBack();
          }
        },
        {
          label: "Go Forward",
          accelerator: "CmdOrCtrl+Right",
          click: () => {
            const tabWc = getTabWcFromFocusedWindow();
            if (!tabWc) return;
            tabWc.navigationHistory.goForward();
          }
        }
      ]
    },
    { role: "windowMenu" as const }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
