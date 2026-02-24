import { Tab } from "./tab";
import { BrowserWindow } from "@/controllers/windows-controller/types";

/**
 * Pre-sleep state stored in memory so the serialization layer
 * can persist the "real" URL/nav history even while the tab is asleep
 * (webContents is destroyed during sleep).
 */
export interface PreSleepState {
  url: string;
  navHistory: Electron.NavigationEntry[];
  navHistoryIndex: number;
}

/**
 * Manages tab lifecycle transitions: sleep/wake, fullscreen, and picture-in-picture.
 *
 * Design notes:
 * - Owns the pre-sleep state snapshot so serialization can access the "real" data
 * - Reads tab state but mutates it only through tab.updateStateProperty()
 * - Does NOT know about persistence or the controller
 *
 * Sleep/wake now destroys and recreates the WebContentsView entirely,
 * saving ~20-50MB RAM per sleeping tab compared to the old approach
 * of navigating to about:blank?sleep=true.
 */
export class TabLifecycleManager {
  /** Snapshot of URL/nav state taken before the tab goes to sleep */
  public preSleepState: PreSleepState | null = null;

  /** Disconnect function for the window "leave-full-screen" listener */
  private disconnectLeaveFullScreen: (() => void) | null = null;

  constructor(private readonly tab: Tab) {}

  // --- Sleep / Wake ---

  /**
   * Puts the tab to sleep to save resources.
   * Captures a snapshot of the current URL and navigation history,
   * then destroys the WebContentsView entirely.
   *
   * @param knownPreSleepState - If provided, use this as the pre-sleep state
   *   instead of reading from the tab. Used when constructing sleeping tabs
   *   from persisted data where webContents doesn't exist.
   */
  putToSleep(knownPreSleepState?: PreSleepState): void {
    if (this.tab.asleep) return;

    // Capture pre-sleep state before anything changes
    if (knownPreSleepState) {
      // Use the explicitly provided state (e.g. from restoration data)
      this.preSleepState = knownPreSleepState;
    } else {
      this.tab.updateTabState(); // ensure state is fresh

      this.preSleepState = {
        url: this.tab.url,
        navHistory: [...this.tab.navHistory],
        navHistoryIndex: this.tab.navHistoryIndex
      };
    }

    this.tab.updateStateProperty("asleep", true);

    // Destroy the view and webContents to free resources
    this.tab.teardownView();
  }

  /**
   * Wakes a sleeping tab by recreating the WebContentsView and restoring
   * navigation history from the pre-sleep state snapshot.
   */
  wakeUp(): void {
    if (!this.tab.asleep) return;

    const window = this.tab.getWindow();

    // Recreate view, webContents, listeners, extensions
    this.tab.initializeView();

    // Add view to window's ViewManager
    this.tab.setWindow(window);

    // Re-setup fullscreen listeners on the new webContents
    this.setupFullScreenListeners(window);

    // Mark as awake
    this.tab.updateStateProperty("asleep", false);

    // Restore navigation history from pre-sleep state
    if (this.preSleepState) {
      this.tab.restoreNavigationHistory(this.preSleepState.navHistory, this.preSleepState.navHistoryIndex);
      this.preSleepState = null;
    }
  }

  // --- Fullscreen ---

  /**
   * Enters or exits fullscreen for this tab.
   * Coordinates with the Electron BrowserWindow fullscreen state.
   */
  setFullScreen(isFullScreen: boolean): boolean {
    const updated = this.tab.updateStateProperty("fullScreen", isFullScreen);
    if (!updated) return false;

    const window = this.tab.getWindow();
    const electronWindow = window.browserWindow;
    if (window.destroyed) return false;

    if (isFullScreen) {
      if (!electronWindow.fullScreen) {
        electronWindow.setFullScreen(true);
      }
    } else {
      if (electronWindow.fullScreen) {
        electronWindow.setFullScreen(false);
      }

      const webContents = this.tab.webContents;
      if (webContents) {
        setTimeout(() => {
          webContents.executeJavaScript(`if (document.fullscreenElement) { document.exitFullscreen(); }`, true);
        }, 100);
      }
    }

    return true;
  }

  /**
   * Sets up fullscreen event listeners on the tab's webContents.
   * Idempotent: disconnects previous listeners before registering new ones.
   * Called during tab initialization and on wake from sleep.
   */
  setupFullScreenListeners(window: BrowserWindow): void {
    const webContents = this.tab.webContents;
    if (!webContents) return;

    const electronWindow = window.browserWindow;

    webContents.on("enter-html-full-screen", () => {
      this.setFullScreen(true);
      // Notify the tab so layout can be updated
      this.tab.emit("fullscreen-changed", true);
    });

    webContents.on("leave-html-full-screen", () => {
      if (electronWindow.fullScreen) {
        electronWindow.setFullScreen(false);
      }
    });

    // Disconnect previous leave-full-screen listener before registering a new one
    if (this.disconnectLeaveFullScreen) {
      this.disconnectLeaveFullScreen();
      this.disconnectLeaveFullScreen = null;
    }

    const disconnectLeaveFullScreen = window.connect("leave-full-screen", () => {
      this.setFullScreen(false);
      this.tab.emit("fullscreen-changed", false);
    });

    this.disconnectLeaveFullScreen = disconnectLeaveFullScreen;

    this.tab.on("destroyed", () => {
      if (window.isEmitterDestroyed()) return;
      if (this.disconnectLeaveFullScreen) {
        this.disconnectLeaveFullScreen();
        this.disconnectLeaveFullScreen = null;
      }
    });
  }

  // --- Picture-in-Picture ---

  /**
   * Attempts to exit picture-in-picture mode for this tab.
   * Used when a tab becomes visible again.
   */
  async exitPictureInPicture(): Promise<boolean> {
    const webContents = this.tab.webContents;
    if (!webContents) return false;

    // This function runs in the renderer context
    const exitPiP = function () {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
        return true;
      }
      return false;
    };

    try {
      const result = await webContents.executeJavaScript(`(${exitPiP})()`, true);
      if (result === true) {
        this.tab.updateStateProperty("isPictureInPicture", false);
        return true;
      }
    } catch (err) {
      console.error("PiP exit error:", err);
    }
    return false;
  }

  /**
   * Attempts to enter picture-in-picture mode for this tab.
   * Used when a tab becomes hidden but has playing video.
   */
  async enterPictureInPicture(): Promise<boolean> {
    const webContents = this.tab.webContents;
    if (!webContents) return false;

    // This function runs in the renderer context
    const enterPiP = async function () {
      const videos = Array.from(document.querySelectorAll("video")).filter(
        (video) => !video.paused && !video.ended && video.readyState > 2
      );

      if (videos.length > 0 && document.pictureInPictureElement !== videos[0]) {
        try {
          const video = videos[0];
          await video.requestPictureInPicture();

          const onLeavePiP = () => {
            setTimeout(() => {
              const goBackToTab = !video.paused && !video.ended;
              flow.tabs.disablePictureInPicture(goBackToTab);
            }, 50);
            video.removeEventListener("leavepictureinpicture", onLeavePiP);
          };

          video.addEventListener("leavepictureinpicture", onLeavePiP);
          return true;
        } catch (e) {
          console.error("Failed to enter Picture in Picture mode:", e);
          return false;
        }
      }
      return null;
    };

    try {
      const result = await webContents.executeJavaScript(`(${enterPiP})()`, true);
      if (result === true) {
        this.tab.updateStateProperty("isPictureInPicture", true);
        return true;
      }
    } catch (err) {
      console.error("PiP enter error:", err);
    }
    return false;
  }

  // --- Cleanup ---

  /**
   * Called when the tab is being destroyed.
   * Handles cleanup of fullscreen state if needed.
   */
  onDestroy(): void {
    if (this.tab.fullScreen) {
      const window = this.tab.getWindow();
      if (!window.destroyed) {
        window.browserWindow.setFullScreen(false);
      }
    }
  }
}
