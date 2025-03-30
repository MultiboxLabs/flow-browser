import { app, BrowserWindow, ipcMain, nativeTheme, session } from "electron";
import { registerWindow, WindowType } from "@/modules/windows";
import { PATHS } from "@/modules/paths";

let settingsWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  const defaultSession = session.defaultSession;
  defaultSession.registerPreloadScript({
    id: "flow-preload",
    type: "frame",
    filePath: PATHS.PRELOAD
  });
});

function createSettingsWindow() {
  const window = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 600,
    center: true,
    show: false,
    frame: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
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

  registerWindow(WindowType.SETTINGS, "settings", window);
  settingsWindow = window;
}

export const settings = {
  show: () => {
    if (!settingsWindow) {
      createSettingsWindow();
    }

    if (!settingsWindow) return;

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
    if (!settingsWindow) return;

    if (settingsWindow.isVisible()) {
      settings.hide();
    } else {
      settings.show();
    }
  }
};

// IPC Handlers //
ipcMain.on("settings:open", () => {
  settings.show();
});

ipcMain.on("settings:close", () => {
  settings.hide();
});
