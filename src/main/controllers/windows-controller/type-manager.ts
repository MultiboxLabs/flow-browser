import { WindowsController, WindowType } from "@/controllers/windows-controller";
import { BaseWindow } from "@/controllers/windows-controller/types";
import { generateID } from "@/modules/utils";

export type WindowTypeManagerOptions = {
  /**
   * If true, only one window of this type can be open at a time.
   */
  singleton?: boolean;
};

export class WindowTypeManager<C extends new (...args: unknown[]) => BaseWindow> {
  private windowsController: WindowsController;
  private windowType: WindowType;
  private readonly windowConstructor: C;
  private options: WindowTypeManagerOptions;

  constructor(
    windowsController: WindowsController,
    windowType: WindowType,
    windowConstructor: C,
    options: WindowTypeManagerOptions
  ) {
    this.windowsController = windowsController;
    this.windowType = windowType;
    this.windowConstructor = windowConstructor;
    this.options = options;
  }

  // New Function //
  private _new(id: string, ...args: ConstructorParameters<C>): InstanceType<C> {
    const WindowConstructor = this.windowConstructor;
    const window = new WindowConstructor(...args) as InstanceType<C>;
    this.windowsController._addWindow(id, window);
    return window;
  }

  public new(id?: string, ...args: ConstructorParameters<C>): InstanceType<C> {
    this._checkNotSingleton();

    const windowId = id ?? generateID();
    return this._new(windowId, ...args);
  }

  // Basic Functions //
  public getAll(): InstanceType<C>[] {
    const allWindows = this.windowsController.getAllWindows();
    return allWindows.filter((window): window is InstanceType<C> => window.type === this.windowType);
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

    return this._new(generateID(), ...args);
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
