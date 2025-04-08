import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { TabbedBrowserWindow } from "@/browser/window";
import { WebContents } from "electron";
import { BrowserEvents } from "@/browser/events";
import { ProfileManager, LoadedProfile } from "@/browser/profile-manager";
import { WindowManager, BrowserWindowType, BrowserWindowCreationOptions } from "@/browser/window-manager";
import { Tab } from "@/browser/tab";

/**
 * Main Browser controller that coordinates browser components
 *
 * The Browser is responsible for:
 * - Coordinating window and profile management
 * - Handling lifecycle events
 * - Providing a unified API for browser operations
 */
export class Browser extends TypedEventEmitter<BrowserEvents> {
  private readonly profileManager: ProfileManager;
  private readonly windowManager: WindowManager;
  private _isDestroyed: boolean = false;

  /**
   * Creates a new Browser instance
   */
  constructor() {
    super();
    this.windowManager = new WindowManager(this);
    this.profileManager = new ProfileManager(this, this);

    // Create initial window after next tick to ensure proper initialization
    setTimeout(() => this.createWindow(), 0);
  }

  // Profile Management - Delegated to ProfileManager
  /**
   * Gets a loaded profile by ID
   */
  public getLoadedProfile(profileId: string): LoadedProfile | undefined {
    return this.profileManager.getProfile(profileId);
  }

  /**
   * Gets all loaded profiles
   */
  public getLoadedProfiles(): LoadedProfile[] {
    return this.profileManager.getProfiles();
  }

  /**
   * Loads a profile by ID and creates the first window if needed
   */
  public async loadProfile(profileId: string): Promise<boolean> {
    try {
      const result = await this.profileManager.loadProfile(profileId);
      return result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Unloads a profile by ID
   */
  public unloadProfile(profileId: string): boolean {
    return this.profileManager.unloadProfile(profileId);
  }

  // Window Management - Delegated to WindowManager
  /**
   * Creates a new browser window
   */
  public async createWindow(
    type: BrowserWindowType = "normal",
    options: BrowserWindowCreationOptions = {}
  ): Promise<TabbedBrowserWindow> {
    return this.windowManager.createWindow(this, type, options);
  }

  /**
   * Gets all windows
   */
  public getWindows(): TabbedBrowserWindow[] {
    return this.windowManager.getWindows();
  }

  /**
   * Gets a window by its ID
   */
  public getWindowById(windowId: number): TabbedBrowserWindow | undefined {
    return this.windowManager.getWindowById(windowId);
  }

  /**
   * Gets a window from WebContents
   */
  public getWindowFromWebContents(webContents: WebContents): TabbedBrowserWindow | null {
    return this.windowManager.getWindowFromWebContents(webContents);
  }

  /**
   * Destroys a window by its ID
   */
  public destroyWindowById(windowId: number): boolean {
    return this.windowManager.destroyWindowById(windowId);
  }

  /**
   * Checks if the browser is destroyed
   */
  public checkIsDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Cleans up and destroys the browser
   */
  public destroy(): void {
    if (this._isDestroyed) {
      throw new Error("Browser already destroyed!");
    }

    try {
      // Destroy all windows
      this.windowManager.destroyAll();

      // Unload all profiles
      this.profileManager.unloadAll();

      // Mark as destroyed and emit event
      this._isDestroyed = true;
      this.emit("destroy");
    } catch (error) {
      console.error("Error during browser destruction:", error);
    } finally {
      // Always destroy the emitter
      this.destroyEmitter();
    }
  }

  /**
   * Get tab from ID
   */
  public getTabFromId(tabId: number): Tab | undefined {
    return this.profileManager.getTabFromId(tabId);
  }
}
