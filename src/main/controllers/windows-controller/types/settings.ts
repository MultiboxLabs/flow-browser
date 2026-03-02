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

      // On Linux, "hidden" combined with frame:false prevents
      // ready-to-show from firing. Match BrowserWindow's pattern and
      // leave it undefined on Linux.
      titleBarStyle:
        process.platform === "darwin" ? "hiddenInset" : process.platform === "win32" ? "hidden" : undefined,
      titleBarOverlay: {
        height: 40,
        symbolColor: nativeTheme.shouldUseDarkColors ? "white" : "black",
        color: "rgba(0,0,0,0)"
      },

      // Match BrowserWindow's webPreferences so the renderer initializes
      // identically on all platforms (especially Linux where missing
      // sandbox/contextIsolation can prevent ready-to-show from firing).
      webPreferences: {
        sandbox: true,
        nodeIntegration: false,
        contextIsolation: true
      },

      // Explicit background color ensures the compositor has an initial paint
      // on Linux, which is required for ready-to-show to fire for frameless
      // windows.
      backgroundColor: process.platform === "darwin" ? "#00000000" : "#000000"
    });

    // Use settings.hide's behavior instead of the default one
    browserWindow.on("close", (event) => {
      event.preventDefault();
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

    // Fallback: On Linux, ready-to-show may never fire for frameless
    // windows. If did-finish-load fires but the window still isn't
    // visible after a short delay, force-unblock the show() call by
    // emitting "loaded" so that waitUntil("loaded") resolves.
    if (process.platform === "linux") {
      browserWindow.webContents.once("did-finish-load", () => {
        setTimeout(() => {
          if (!this.destroyed && !browserWindow.isDestroyed() && !browserWindow.isVisible()) {
            this.emit("loaded");
          }
        }, 200);
      });
    }
  }
}
