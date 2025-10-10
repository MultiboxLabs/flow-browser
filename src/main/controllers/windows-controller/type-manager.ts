import { WindowsController, WindowType } from "@/controllers/windows-controller";
import { BaseWindow } from "@/controllers/windows-controller/types";
import { type WebContents } from "electron";

export type WindowTypeManagerOptions = {
  /**
   * If true, only one window of this type can be open at a time.
   */
  singleton?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class WindowTypeManager<C extends new (...args: any[]) => BaseWindow> {
  private windowsController: WindowsController;
  private windowType: WindowType;
  private readonly windowConstructor: C;
  private options: WindowTypeManagerOptions;

  constructor(
    windowsController: WindowsController,
    windowType: WindowType,
    windowConstructor: C,
    options: WindowTypeManagerOptions = {}
  ) {
    this.windowsController = windowsController;
    this.windowType = windowType;
    this.windowConstructor = windowConstructor;
    this.options = options;
  }

  // New Function //
  private _new(...args: ConstructorParameters<C>): InstanceType<C> {
    const WindowConstructor = this.windowConstructor;
    const window = new WindowConstructor(...args) as InstanceType<C>;
    this.windowsController._addWindow(window);
    return window;
  }

  public new(...args: ConstructorParameters<C>): InstanceType<C> {
    this._checkNotSingleton();
    return this._new(...args);
  }

  // Instance Validation //
  public isInstanceOf(window: BaseWindow): window is InstanceType<C> {
    return window.type === this.windowType;
  }

  public filterInstance(window: BaseWindow | null): InstanceType<C> | null {
    if (window && this.isInstanceOf(window)) {
      return window;
    }
    return null;
  }

  // Basic Functions //
  public getAll(): InstanceType<C>[] {
    const allWindows = this.windowsController.getAllWindows();
    return allWindows.filter((window): window is InstanceType<C> => window.type === this.windowType);
  }

  public getFocused(): InstanceType<C> | null {
    const window = this.windowsController.getFocused();
    return this.filterInstance(window);
  }

  public getById(id: number): InstanceType<C> | null {
    const window = this.windowsController.getWindowById(id);
    return this.filterInstance(window);
  }

  public getFromWebContents(webContents: WebContents): InstanceType<C> | null {
    const window = this.windowsController.getWindowFromWebContents(webContents);
    return this.filterInstance(window);
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
  public getSingletonWindow(...args: ConstructorParameters<C>): InstanceType<C> {
    this._checkIsSingleton();

    const openWindows = this.getAll();
    if (openWindows.length > 0) {
      return openWindows[0];
    }

    return this._new(...args);
  }

  /**
   * Gets an existing singleton window if it exists, otherwise returns null.
   */
  public getExistingSingletonWindow(): InstanceType<C> | null {
    this._checkIsSingleton();

    const openWindows = this.getAll();
    if (openWindows.length > 0) {
      return openWindows[0];
    }
    return null;
  }
}
