import { BaseWindow } from "@/controllers/windows-controller/types/base";
import { BrowserWindow, nativeTheme } from "electron";

export class SettingsWindow extends BaseWindow {
  constructor() {
    const browserWindow = new BrowserWindow({
      width: 800,
      minWidth: 800,
      height: 600,
      minHeight: 600,

      center: true,
      show: false,
      frame: false,
      roundedCorners: true,

      titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
      titleBarOverlay: {
        height: 40,
        symbolColor: nativeTheme.shouldUseDarkColors ? "white" : "black",
        color: "rgba(0,0,0,0)"
      },

      vibrancy: "fullscreen-ui" // on MacOS
    });
    browserWindow.loadURL("flow-internal://settings/");

    // Use settings.hide's behavior instead of the default one
    browserWindow.on("close", () => {
      browserWindow.hide();
    });

    super("settings", browserWindow);
  }
}
