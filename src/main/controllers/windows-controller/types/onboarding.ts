import { BaseWindow } from "@/controllers/windows-controller/types/base";
import { BrowserWindow, nativeTheme } from "electron";

export class OnboardingWindow extends BaseWindow {
  constructor() {
    const browserWindow = new BrowserWindow({
      width: 1000,
      height: 700,

      resizable: false,
      center: true,
      show: true,
      frame: false,
      roundedCorners: true,

      titleBarStyle: "hidden",
      titleBarOverlay: {
        height: 20,
        symbolColor: nativeTheme.shouldUseDarkColors ? "white" : "black",
        color: "rgba(0,0,0,0)"
      }
    });
    browserWindow.loadURL("flow-internal://onboarding/");

    // Use settings.hide's behavior instead of the default one
    browserWindow.on("close", () => {
      browserWindow.hide();
    });

    super("onboarding", browserWindow);
  }
}
