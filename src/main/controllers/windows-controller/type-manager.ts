import { WindowsController, WindowType } from "@/controllers/windows-controller";
import { BaseWindow } from "@/controllers/windows-controller/types";
import { generateID } from "@/modules/utils";

export type WindowTypeManagerOptions = {
  /**
   * If true, only one window of this type can be open at a time.
   */
  singleton?: boolean;
};

export class WindowTypeManager {
  private windowsController: WindowsController;
  private windowType: WindowType;
  private windowConstructor: new () => BaseWindow;
  private options: WindowTypeManagerOptions;

  constructor(
    windowsController: WindowsController,
    windowType: WindowType,
    windowConstructor: new () => BaseWindow,
    options: WindowTypeManagerOptions
  ) {
    this.windowsController = windowsController;
    this.windowType = windowType;
    this.windowConstructor = windowConstructor;
    this.options = options;
  }

  // New Function //
  private _new(id: string) {
    const window = new this.windowConstructor();
    this.windowsController._addWindow(id, window);
    return window;
  }

  public new(id?: string) {
    this._checkNotSingleton();

    if (!id) {
      id = generateID();
    }
    return this._new(id);
  }

  // Basic Functions //
  public getAll() {
    const allWindows = this.windowsController.getAllWindows();
    return allWindows.filter((window) => window.type === this.windowType);
  }

  // Singleton Functions //
  private _checkIsSingleton() {
    if (this.options.singleton !== true) {
      throw new Error("Singleton is not enabled");
    }
  }
  private _checkNotSingleton() {
    if (this.options.singleton === true) {
      throw new Error("Singleton is enabled");
    }
  }

  /**
   * Gets a singleton window if it exists, otherwise creates a new one.
   */
  public getSingletonWindow() {
    this._checkIsSingleton();

    const openWindows = this.getAll();
    if (openWindows.length > 0) {
      return openWindows[0];
    }

    return this._new(generateID());
  }

  /**
   * Gets an existing singleton window if it exists, otherwise returns null.
   */
  public getExistingSingletonWindow() {
    this._checkIsSingleton();

    const openWindows = this.getAll();
    if (openWindows.length > 0) {
      return openWindows[0];
    }
    return null;
  }
}
