import { app, Session } from "electron";
import { getSession } from "@/browser/sessions";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getProfile, ProfileData } from "@/sessions/profiles";
import { BrowserEvents } from "@/browser/events";
import { Browser } from "@/browser/browser";
import { getSpacesFromProfile } from "@/sessions/spaces";
import { FLAGS } from "@/modules/flags";

/**
 * Represents a loaded browser profile
 */
export type LoadedProfile = {
  readonly profileId: string;
  readonly profileData: ProfileData;
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

      // Remove Electron and App details to closer emulate Chrome's UA
      if (FLAGS.SCRUBBED_USER_AGENT) {
        const userAgent = profileSession
          .getUserAgent()
          .replace(/\sElectron\/\S+/, "")
          .replace(new RegExp(`\\s${app.getName()}/\\S+`, "i"), "");
        profileSession.setUserAgent(userAgent);
      }

      const newProfile: LoadedProfile = {
        profileId,
        profileData,
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

      // Destroy all tabs in the profile
      this.browser.tabs.getTabsInProfile(profileId).forEach((tab) => {
        tab.destroy();
      });
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
}
