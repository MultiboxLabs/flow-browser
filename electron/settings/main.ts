import { BrowserWindow, nativeTheme } from "electron";
import { registerWindow, WindowType } from "@/modules/windows";

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
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    titleBarOverlay: {
      height: 40,
      symbolColor: nativeTheme.shouldUseDarkColors ? "white" : "black",
      color: "rgba(0,0,0,0)"
    },
    roundedCorners: true
  });

  window.loadURL("flow-internal://settings/");

  window.on("closed", () => {
    settingsWindow = null;
  });

  registerWindow(WindowType.SETTINGS, "settings", window);
  settingsWindow = window;

  return new Promise((resolve) => {
    window.once("ready-to-show", () => {
      resolve(window);
    });
  });
}

export const settings = {
  show: async () => {
    if (!settingsWindow) {
      await createSettingsWindow();
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
