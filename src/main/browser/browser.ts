import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { BrowserEvents } from "@/browser/events";
import { ProfileManager, LoadedProfile } from "@/browser/profile-manager";
import { TabManager } from "@/browser/tabs/tab-manager";
import { Tab } from "@/browser/tabs/tab";
import { settings } from "@/controllers/windows-controller/interfaces/settings";
import { onboarding } from "@/controllers/windows-controller/interfaces/onboarding";
import "@/modules/extensions/main";

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
  private readonly tabManager: TabManager;
  private _isDestroyed: boolean = false;
  public tabs: TabManager;

  /**
   * Creates a new Browser instance
   */
  constructor() {
    super();
    this.profileManager = new ProfileManager(this, this);
    this.tabManager = new TabManager(this);

    // A public reference to the tab manager
    this.tabs = this.tabManager;
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
    } catch {
      return false;
    }
  }

  /**
   * Unloads a profile by ID
   */
  public unloadProfile(profileId: string): boolean {
    return this.profileManager.unloadProfile(profileId);
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
    return this.tabManager.getTabById(tabId);
  }

  /**
   * Sends a message to all core WebContents
   * TODO: remove this placeholder function and replace with new one
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public sendMessageToCoreWebContents(channel: string, ...args: any[]) {
    // for (const window of this.getWindows()) {
    //   window.sendMessageToCoreWebContents(channel, ...args);
    // }
    settings.sendMessage(channel, ...args);
    onboarding.sendMessage(channel, ...args);
  }
}
