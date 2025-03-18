import { Menu, type MenuItem, type MenuItemConstructorOptions } from "electron";
import { Browser } from "./main";

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
            win.tabs.create();
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
    { role: "editMenu" as const },
    {
      label: "View",
      submenu: [
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
            const tab = getTab();
            if (!tab) return;
            tab.destroy();
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
    { role: "windowMenu" as const }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
