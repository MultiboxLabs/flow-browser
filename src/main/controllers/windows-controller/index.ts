import { WindowTypeManager } from "@/controllers/windows-controller/type-manager";
import { SettingsWindow, BaseWindow, OnboardingWindow, BrowserWindow } from "@/controllers/windows-controller/types";
import { debugPrint } from "@/modules/output";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { type WebContents } from "electron";
import "./close-preventer";

export type WindowType = "browser" | "settings" | "onboarding";

type WindowsControllerEvents = {
  "window-added": [id: number, window: BaseWindow];
  "window-removed": [id: number, window: BaseWindow];
};

class WindowsController extends TypedEventEmitter<WindowsControllerEvents> {
  private windows: Map<number, BaseWindow>;

  // Window Type Managers //
  public settings: WindowTypeManager<typeof SettingsWindow>;
  public onboarding: WindowTypeManager<typeof OnboardingWindow>;
  public browser: WindowTypeManager<typeof BrowserWindow>;

  constructor() {
    super();

    this.windows = new Map();

    // Window Type Managers //
    this.settings = new WindowTypeManager(this, "settings", SettingsWindow, { singleton: true });
    this.onboarding = new WindowTypeManager(this, "onboarding", OnboardingWindow, { singleton: true });
    this.browser = new WindowTypeManager(this, "browser", BrowserWindow);
  }

  // Add & Remove //
  /** Warning: This should only be used internally! */
  public _addWindow(window: BaseWindow) {
    const id = window.id;
    this.windows.set(id, window);
    this.emit("window-added", id, window);

    window.on("destroyed", () => this._removeWindow(id));

    debugPrint("WINDOWS", "Window added with type", window.type, "and id", id);
  }

  /** Warning: This should only be used internally! */
  public _removeWindow(id: number) {
    const window = this.windows.get(id);
    if (window) {
      this.windows.delete(id);
      this.emit("window-removed", id, window);

      debugPrint("WINDOWS", "Window removed with type", window.type, "and id", id);
    }
  }

  // Get Functions //
  public getFocused() {
    for (const window of this.windows.values()) {
      if (window.browserWindow.isFocused()) {
        return window;
      }
    }
    return null;
  }

  public getWindowById(id: number) {
    const window = this.windows.get(id);
    return window ? window : null;
  }

  public getWindowFromWebContents(webContents: WebContents): BaseWindow | null {
    for (const window of this.windows.values()) {
      const foundWebContents = window.getAllWebContents();

      for (const wc of foundWebContents) {
        if (wc.id === webContents.id) {
          return window;
        }
      }
    }
    return null;
  }

  public getIdFromWindow(window: BaseWindow) {
    for (const [id, w] of this.windows.entries()) {
      if (w === window) {
        return id;
      }
    }
    return null;
  }

  public getAllWindows() {
    return Array.from(this.windows.values());
  }
}

export { type WindowsController };
export const windowsController = new WindowsController();
