import { createBetterSession } from "@/browser/utility/web-requests";
import { browser } from "@/index";
import { debugPrint } from "@/modules/output";
import { getSettingValueById, onSettingsCached, settingsEmitter } from "@/saving/settings";
import { ElectronBlocker } from "@ghostery/adblocker-electron";
import { Session } from "electron";

type BlockerInstanceType = "all" | "adsAndTrackers" | "adsOnly";

const SESSION_KEY = "content-blocker";

/**
 * ContentBlocker class manages ad and tracking content blocking functionality
 */
class ContentBlocker {
  private blockerInstancePromise: Promise<ElectronBlocker> | undefined = undefined;
  private blockerInstanceType: BlockerInstanceType | undefined = undefined;
  private blockedSessions: Session[] = [];

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
    switch (type) {
      case "all":
        this.blockerInstancePromise = ElectronBlocker.fromPrebuiltFull();
        break;
      case "adsAndTrackers":
        this.blockerInstancePromise = ElectronBlocker.fromPrebuiltAdsAndTracking();
        break;
      case "adsOnly":
        this.blockerInstancePromise = ElectronBlocker.fromPrebuiltAdsOnly();
        break;
    }

    this.blockerInstancePromise.then((blocker) => {
      blocker.on("request-blocked", (request) => {
        debugPrint("CONTENT_BLOCKER", "Request blocked:", request.url);
      });
    });

    this.blockerInstanceType = type;
    return this.blockerInstancePromise as Promise<ElectronBlocker>;
  }

  /**
   * Disables content blocking on all sessions
   */
  private async disableBlocker(): Promise<void> {
    if (!this.blockerInstancePromise) return;

    const blocker = await this.blockerInstancePromise;
    for (const session of this.blockedSessions) {
      blocker.disableBlockingInSession(createBetterSession(session, SESSION_KEY));
    }

    this.blockedSessions = [];
    this.blockerInstancePromise = undefined;
    this.blockerInstanceType = undefined;
  }

  /**
   * Enables content blocking for a specific session
   */
  private async enableBlockerForSession(blockerType: BlockerInstanceType, session: Session): Promise<void> {
    const blocker = await this.createBlockerInstance(blockerType);
    if (!blocker) return;

    // check if session is already blocked
    if (this.blockedSessions.includes(session)) return;

    // add session to blocked sessions
    this.blockedSessions.push(session);

    // enable blocking in session
    blocker.enableBlockingInSession(createBetterSession(session, SESSION_KEY));
  }

  /**
   * Updates content blocker configuration based on user settings
   */
  public async updateConfig(): Promise<void> {
    if (!browser) return;

    const contentBlocker = getSettingValueById("contentBlocker") as string | undefined;
    const profiles = browser.getLoadedProfiles();

    switch (contentBlocker) {
      case "all":
      case "adsAndTrackers":
      case "adsOnly":
        for (const profile of profiles) {
          this.enableBlockerForSession(contentBlocker as BlockerInstanceType, profile.session);
        }
        break;
      default:
        this.disableBlocker();
    }

    debugPrint("CONTENT_BLOCKER", "Content blocker configuration updated:", contentBlocker);
  }

  /**
   * Initializes content blocker and sets up event listeners
   */
  public async initialize(): Promise<void> {
    // Initial configuration
    await this.updateConfig();

    // Listen for setting changes
    settingsEmitter.on("settings-changed", () => {
      this.updateConfig();
    });

    // Listen for profile changes
    browser?.on("profile-loaded", () => {
      this.updateConfig();
    });
  }
}

// Export singleton instance
export const contentBlocker = new ContentBlocker();

// Initialize content blocker when module is loaded
onSettingsCached().then(() => {
  debugPrint("CONTENT_BLOCKER", "Initializing content blocker");
  contentBlocker.initialize();
});
