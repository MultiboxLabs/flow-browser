import { BaseWindow } from "@/controllers/windows-controller/types/base";
import { sessionsController } from "@/controllers/sessions-controller";
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

      // On Linux, "hidden" with frame:false activates the Window Controls
      // Overlay code-path which is unsupported and prevents the window from
      // rendering (ready-to-show never fires). Match BrowserWindow's pattern
      // and leave it undefined on Linux.
      titleBarStyle:
        process.platform === "darwin" ? "hiddenInset" : process.platform === "win32" ? "hidden" : undefined,
      titleBarOverlay: {
        height: 40,
        symbolColor: nativeTheme.shouldUseDarkColors ? "white" : "black",
        color: "rgba(0,0,0,0)"
      }
    });

    // Use settings.hide's behavior instead of the default one
    browserWindow.on("close", () => {
      browserWindow.hide();
    });

    super("settings", browserWindow, { deferShowUntilAfterLoad: true });

    // Wait for default session (and its protocol handlers) to be ready
    // before loading the flow-internal:// URL, matching the pattern used
    // by BrowserWindow and OnboardingWindow. Without this, the loadURL
    // call can fail on Linux if the protocol hasn't been registered yet.
    sessionsController.whenDefaultSessionReady().then(() => {
      browserWindow.loadURL("flow-internal://settings/");
    });
  }
}
