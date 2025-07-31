import { createBetterSession } from "@/browser/utility/web-requests";
import { browser } from "@/index";
import { debugPrint } from "@/modules/output";
import { getSettingValueById, onSettingsCached, settingsEmitter } from "@/saving/settings";
import { ElectronBlocker } from "@ghostery/adblocker-electron";
import { Session } from "electron";

type BlockerInstanceType = "all" | "adsAndTrackers" | "adsOnly";

const SESSION_KEY = "content-blocker";

interface BlockerConfig {
  type: BlockerInstanceType;
  enabled: boolean;
}

/**
 * ContentBlocker class manages ad and tracking content blocking functionality
 * with improved memory management, error handling, and performance optimizations
 */
class ContentBlocker {
  private blockerInstancePromise: Promise<ElectronBlocker> | undefined = undefined;
  private blockerInstanceType: BlockerInstanceType | undefined = undefined;
  private blockedSessions = new Set<Session>();
  private isInitialized = false;
  private updateTimeout: NodeJS.Timeout | undefined;

  /**
   * Creates or returns existing blocker instance of the specified type
   */
  private async createBlockerInstance(type: BlockerInstanceType): Promise<ElectronBlocker> {
    if (this.blockerInstancePromise && this.blockerInstanceType === type) {
      return this.blockerInstancePromise;
    }

    if (this.blockerInstancePromise) {
      await this.disableBlocker();
    }

    debugPrint("CONTENT_BLOCKER", "Creating blocker instance:", type);

    try {
      let promise: Promise<ElectronBlocker>;

      switch (type) {
        case "all":
          promise = ElectronBlocker.fromPrebuiltFull();
          break;
        case "adsAndTrackers":
          promise = ElectronBlocker.fromPrebuiltAdsAndTracking();
          break;
        case "adsOnly":
          promise = ElectronBlocker.fromPrebuiltAdsOnly();
          break;
      }

      this.blockerInstancePromise = promise;
      this.blockerInstanceType = type;

      const blocker = await promise;
      blocker.on("request-blocked", (request) => {
        debugPrint("CONTENT_BLOCKER", "Request blocked:", request.url);
      });

      return blocker;
    } catch (error) {
      debugPrint("CONTENT_BLOCKER", "Failed to create blocker instance:", error);
      this.blockerInstancePromise = undefined;
      this.blockerInstanceType = undefined;
      throw error;
    }
  }

  /**
   * Disables content blocking on all sessions
   */
  private async disableBlocker(): Promise<void> {
    if (!this.blockerInstancePromise) return;

    try {
      const blocker = await this.blockerInstancePromise;

      // Disable blocking for all sessions
      const disablePromises = Array.from(this.blockedSessions).map((session) =>
        blocker.disableBlockingInSession(createBetterSession(session, SESSION_KEY))
      );

      await Promise.allSettled(disablePromises);

      this.blockedSessions.clear();
      this.blockerInstancePromise = undefined;
      this.blockerInstanceType = undefined;

      debugPrint("CONTENT_BLOCKER", "Content blocker disabled for all sessions");
    } catch (error) {
      debugPrint("CONTENT_BLOCKER", "Error disabling blocker:", error);
    }
  }

  /**
   * Enables content blocking for a specific session
   */
  private async enableBlockerForSession(blockerType: BlockerInstanceType, session: Session): Promise<void> {
    try {
      const blocker = await this.createBlockerInstance(blockerType);

      // Skip if already blocked
      if (this.blockedSessions.has(session)) return;

      // Enable blocking
      await blocker.enableBlockingInSession(createBetterSession(session, SESSION_KEY));

      // Track blocked session
      this.blockedSessions.add(session);

      debugPrint("CONTENT_BLOCKER", `Enabled ${blockerType} blocking for session`);
    } catch (error) {
      debugPrint("CONTENT_BLOCKER", "Failed to enable blocker for session:", error);
    }
  }

  /**
   * Removes a session from blocking
   */
  public async removeSession(session: Session): Promise<void> {
    if (!this.blockedSessions.has(session)) return;

    try {
      if (this.blockerInstancePromise) {
        const blocker = await this.blockerInstancePromise;
        await blocker.disableBlockingInSession(createBetterSession(session, SESSION_KEY));
      }

      this.blockedSessions.delete(session);
      debugPrint("CONTENT_BLOCKER", "Removed session from content blocking");
    } catch (error) {
      debugPrint("CONTENT_BLOCKER", "Error removing session:", error);
    }
  }

  /**
   * Gets current blocker configuration
   */
  private getBlockerConfig(): BlockerConfig {
    const contentBlocker = getSettingValueById("contentBlocker") as string | undefined;

    switch (contentBlocker) {
      case "all":
      case "adsAndTrackers":
      case "adsOnly":
        return { type: contentBlocker as BlockerInstanceType, enabled: true };
      default:
        return { type: "adsOnly", enabled: false };
    }
  }

  /**
   * Updates content blocker configuration based on user settings
   */
  public async updateConfig(): Promise<void> {
    if (!browser) return;

    // Debounce rapid configuration changes
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(async () => {
      try {
        const config = this.getBlockerConfig();
        const profiles = browser?.getLoadedProfiles() ?? [];

        if (config.enabled) {
          // Enable blocking for all profiles
          const enablePromises = profiles.map((profile) => this.enableBlockerForSession(config.type, profile.session));
          await Promise.allSettled(enablePromises);
        } else {
          // Disable blocking entirely
          await this.disableBlocker();
        }

        debugPrint("CONTENT_BLOCKER", "Content blocker configuration updated:", config);
      } catch (error) {
        debugPrint("CONTENT_BLOCKER", "Error updating configuration:", error);
      }
    }, 100);
  }

  /**
   * Cleans up resources and event listeners
   */
  public async cleanup(): Promise<void> {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = undefined;
    }

    await this.disableBlocker();
    this.isInitialized = false;
  }

  /**
   * Initializes content blocker and sets up event listeners
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initial configuration
      await this.updateConfig();

      // Listen for setting changes
      settingsEmitter.on("settings-changed", this.handleSettingsChanged);

      // Listen for profile changes
      browser?.on("profile-loaded", this.handleProfileLoaded);
      browser?.on("profile-unloaded", this.handleProfileRemoved);

      this.isInitialized = true;
      debugPrint("CONTENT_BLOCKER", "Content blocker initialized successfully");
    } catch (error) {
      debugPrint("CONTENT_BLOCKER", "Failed to initialize content blocker:", error);
    }
  }

  /**
   * Event handlers bound to maintain proper context
   */
  private handleSettingsChanged = () => {
    this.updateConfig();
  };

  private handleProfileLoaded = () => {
    this.updateConfig();
  };

  private handleProfileRemoved = (profileId: string) => {
    // Find the session for this profile and remove it
    if (!browser) return;
    const profile = browser.getLoadedProfile(profileId);
    if (profile) {
      this.removeSession(profile.session);
    }
  };
}

// Export singleton instance
export const contentBlocker = new ContentBlocker();

// Initialize content blocker when module is loaded
onSettingsCached().then(() => {
  debugPrint("CONTENT_BLOCKER", "Initializing content blocker");
  contentBlocker.initialize();
});

// Handle app shutdown
process.on("beforeExit", async () => {
  await contentBlocker.cleanup();
});
