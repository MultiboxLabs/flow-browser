import { Session } from "electron";
import { getSession } from "@/browser/sessions";
import { TabManager } from "@/browser/tabs";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getProfile, ProfileData } from "@/sessions/profiles";
import { BrowserEvents } from "@/browser/events";
import { Browser } from "@/browser/browser";
import { Tab } from "@/browser/tab";
import { getSpacesFromProfile } from "@/sessions/spaces";

/**
 * Represents a loaded browser profile
 */
export type LoadedProfile = {
  readonly profileId: string;
  readonly profileData: ProfileData;
  readonly tabs: TabManager;
  readonly session: Session;
  unload: () => void;
};

/**
 * Manages browser profiles and their lifecycle
 */
export class ProfileManager {
  private readonly profiles: Map<string, LoadedProfile>;
  private readonly eventEmitter: TypedEventEmitter<BrowserEvents>;
  private readonly browser: Browser;

  constructor(browser: Browser, eventEmitter: TypedEventEmitter<BrowserEvents>) {
    this.profiles = new Map();
    this.eventEmitter = eventEmitter;
    this.browser = browser;
  }

  /**
   * Gets a loaded profile by ID
   */
  public getProfile(profileId: string): LoadedProfile | undefined {
    return this.profiles.get(profileId);
  }

  /**
   * Gets all loaded profiles
   */
  public getProfiles(): LoadedProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Loads a profile by ID
   */
  public async loadProfile(profileId: string): Promise<boolean> {
    try {
      // Don't reload existing profiles
      if (this.profiles.has(profileId)) {
        return false;
      }

      const profileData = await getProfile(profileId);
      if (!profileData) {
        console.warn(`Profile data not found for ID: ${profileId}`);
        return false;
      }

      const profileSession = getSession(profileId);
      const tabs = new TabManager(this.browser, profileId, profileSession);

      // Test Code
      getSpacesFromProfile(profileId).then((spaces) => {
        for (const space of spaces) {
          tabs.create(this.browser.getWindows()[0].id, undefined, space.id).then((tab) => {
            tab.loadURL("https://google.com");
            const success = tabs.select(tab.id);
            console.log("created tab in space", space.id);
          });
        }
      });

      const newProfile: LoadedProfile = {
        profileId,
        profileData,
        tabs,
        session: profileSession,
        unload: () => this.handleProfileUnload(profileId)
      };

      this.profiles.set(profileId, newProfile);
      this.eventEmitter.emit("profile-loaded", profileId);
      return true;
    } catch (error) {
      console.error(`Error loading profile ${profileId}:`, error);
      return false;
    }
  }

  /**
   * Handles profile unload
   */
  private handleProfileUnload(profileId: string): void {
    if (this.profiles.delete(profileId)) {
      this.eventEmitter.emit("profile-unloaded", profileId);
    }
  }

  /**
   * Unloads a profile by ID
   */
  public unloadProfile(profileId: string): boolean {
    try {
      const profile = this.profiles.get(profileId);
      if (!profile) {
        return false;
      }

      profile.unload();
      return true;
    } catch (error) {
      console.error(`Error unloading profile ${profileId}:`, error);
      return false;
    }
  }

  /**
   * Unloads all profiles
   */
  public unloadAll(): void {
    const profileIds = [...this.profiles.keys()];
    for (const profileId of profileIds) {
      try {
        this.unloadProfile(profileId);
      } catch (error) {
        console.error(`Error unloading profile ${profileId} during cleanup:`, error);
      }
    }
  }

  /**
   * Get tab from ID
   */
  public getTabFromId(tabId: number): Tab | undefined {
    for (const profile of this.profiles.values()) {
      const tab = profile.tabs.get(tabId);
      if (tab) {
        return tab;
      }
    }
    return undefined;
  }
}
