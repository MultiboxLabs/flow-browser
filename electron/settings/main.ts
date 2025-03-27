import { BrowserWindow, nativeTheme } from "electron";
import buildChromeContextMenu from "electron-chrome-context-menu";
import { browser } from "../index";

let settingsWindow: BrowserWindow | null = null;

function createSettingsWindow() {
  const window = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 600,
    center: true,
    show: false,
    frame: false,
    titleBarStyle: "hiddenInset",
    titleBarOverlay: {
      height: 40,
      symbolColor: nativeTheme.shouldUseDarkColors ? "white" : "black",
      color: "rgba(0,0,0,0)"
    },
    roundedCorners: true
  });

  window.loadURL("flow-utility://page/settings/");

  window.on("closed", () => {
    settingsWindow = null;
  });

  const webContents = window.webContents;
  webContents.on("context-menu", (_event, params) => {
    const menu = buildChromeContextMenu({
      params,
      webContents,
      openLink: (url) => {
        if (!browser) return;

        const win = browser.getFocusedWindow();
        if (!win) return;

        const tab = win.tabs.create();
        tab.loadURL(url);
      }
    });

    menu.popup();
  });

  settingsWindow = window;
}

export const settings = {
  show: () => {
    if (!settingsWindow) {
      createSettingsWindow();
    }

    settingsWindow.show();
    settingsWindow.focus();
  },
  hide: () => {
    if (!settingsWindow) return;

    settingsWindow.blur();
    settingsWindow.hide();
  },
  isVisible: () => {
    if (!settingsWindow) return false;

    return settingsWindow.isVisible();
  },
  toggle: () => {
    if (settingsWindow.isVisible()) {
      settings.hide();
    } else {
      settings.show();
    }
  }
};
