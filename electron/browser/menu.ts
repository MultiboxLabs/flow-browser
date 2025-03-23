import { clipboard, Menu, type MenuItem, type MenuItemConstructorOptions } from "electron";
import { Browser } from "./main";
import { getNewTabMode, hideOmnibox, isOmniboxOpen, loadOmnibox, setOmniboxBounds, showOmnibox } from "./omnibox";

export const setupMenu = (browser: Browser) => {
  const isMac = process.platform === "darwin";

  const getFocusedWindow = () => {
    return browser.getFocusedWindow();
  };
  const getTab = () => {
    const win = getFocusedWindow();
    if (!win) return null;

    const tab = win.getFocusedTab();
    if (!tab) return null;
    return tab;
  };
  const getTabWc = () => {
    const tab = getTab();
    if (!tab) return null;
    return tab.webContents;
  };

  const template: Array<MenuItemConstructorOptions | MenuItem> = [
    ...(isMac ? [{ role: "appMenu" as const }] : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Tab",
          accelerator: "CmdOrCtrl+T",
          click: () => {
            const win = getFocusedWindow();
            if (!win) return;

            const browserWindow = win.getBrowserWindow();
            if (getNewTabMode() === "omnibox") {
              if (isOmniboxOpen(browserWindow)) {
                hideOmnibox(browserWindow);
              } else {
                loadOmnibox(browserWindow, null);
                setOmniboxBounds(browserWindow, null);
                showOmnibox(browserWindow);
              }
            } else {
              win.tabs.create();
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
            const tabWc = getTabWc();
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
          // TODO: Implement toggle sidebar
          label: "Toggle Sidebar",
          enabled: false
        },
        { type: "separator" },
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            const tabWc = getTabWc();
            if (!tabWc) return;
            tabWc.reload();
          }
        },
        {
          label: "Force Reload",
          accelerator: "Shift+CmdOrCtrl+R",
          click: () => {
            const tabWc = getTabWc();
            if (!tabWc) return;
            tabWc.reloadIgnoringCache();
          }
        },
        {
          label: "Close Tab",
          accelerator: "CmdOrCtrl+W",
          click: () => {
            const win = getFocusedWindow();
            if (!win) return;

            const browserWindow = win.getBrowserWindow();
            if (isOmniboxOpen(browserWindow)) {
              // Close Omnibox
              hideOmnibox(browserWindow);
            } else {
              const tab = getTab();
              if (tab) {
                // Close Tab
                tab.destroy();
              } else {
                // Close Window
                const window = getFocusedWindow();
                if (window) {
                  window.destroy();
                }
              }
            }
          }
        },
        {
          label: "Toggle Developer Tools",
          accelerator: isMac ? "Alt+Command+I" : "Ctrl+Shift+I",
          click: () => {
            const tabWc = getTabWc();
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
            const tabWc = getTabWc();
            if (!tabWc) return;
            tabWc.navigationHistory.goBack();
          }
        },
        {
          label: "Go Forward",
          accelerator: "CmdOrCtrl+Right",
          click: () => {
            const tabWc = getTabWc();
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
