import { WindowTypeManager } from "@/controllers/windows-controller/type-manager";
import { SettingsWindow, BaseWindow } from "@/controllers/windows-controller/types";
import { debugPrint } from "@/modules/output";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";

export type WindowType = "browser" | "settings" | "onboarding";

type WindowsControllerEvents = {
  "window-added": [id: string, window: BaseWindow];
  "window-removed": [id: string, window: BaseWindow];
};

class WindowsController extends TypedEventEmitter<WindowsControllerEvents> {
  private windows: Map<string, BaseWindow>;

  // Window Type Managers //
  public settings: WindowTypeManager;

  constructor() {
    super();

    this.windows = new Map();

    // Window Type Managers //
    this.settings = new WindowTypeManager(this, "settings", SettingsWindow, { singleton: true });
  }

  // Add & Remove //
  /** Warning: This should only be used internally! */
  public _addWindow(id: string, window: BaseWindow) {
    this.windows.set(id, window);
    this.emit("window-added", id, window);

    window.on("destroyed", () => this._removeWindow(id));

    debugPrint("WINDOWS", "Window added with type", window.type, "and id", id);
  }

  /** Warning: This should only be used internally! */
  public _removeWindow(id: string) {
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

  public getWindowById(id: string) {
    return this.windows.get(id);
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
