import { Tab, SLEEP_MODE_URL } from "./tab";
import { BrowserWindow } from "@/controllers/windows-controller/types";

/**
 * Pre-sleep state stored in memory so the serialization layer
 * can persist the "real" URL/nav history even while the tab is asleep
 * (webContents shows about:blank?sleep=true).
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
 */
export class TabLifecycleManager {
  /** Snapshot of URL/nav state taken before the tab goes to sleep */
  public preSleepState: PreSleepState | null = null;

  constructor(private readonly tab: Tab) {}

  // --- Sleep / Wake ---

  /**
   * Puts the tab to sleep to save resources.
   * Captures a snapshot of the current URL and navigation history first.
   *
   * @param alreadyLoadedURL - If true, the sleep URL has already been loaded
   *   into webContents (e.g. during restore). Skips the loadURL call.
   * @param knownPreSleepState - If provided, use this as the pre-sleep state
   *   instead of reading from the tab. Required when alreadyLoadedURL is true
   *   because the tab's webContents state is unreliable during restore
   *   (navigation from restore() hasn't completed, so tab.url/navHistory
   *   are either empty defaults or the sleep URL itself).
   */
  putToSleep(alreadyLoadedURL: boolean = false, knownPreSleepState?: PreSleepState): void {
    if (this.tab.asleep) return;

    // Capture pre-sleep state before anything changes
    if (knownPreSleepState) {
      // Use the explicitly provided state (e.g. from restoration data)
      this.preSleepState = knownPreSleepState;
    } else {
      if (!alreadyLoadedURL) {
        this.tab.updateTabState(); // ensure state is fresh
      }

      this.preSleepState = {
        url: this.tab.url,
        navHistory: [...this.tab.navHistory],
        navHistoryIndex: this.tab.navHistoryIndex
      };
    }

    this.tab.updateStateProperty("asleep", true);

    if (!alreadyLoadedURL) {
      this.tab.loadURL(SLEEP_MODE_URL);
    }
  }

  /**
   * Wakes a sleeping tab by navigating back from the sleep URL.
   * Clears the pre-sleep state snapshot after waking.
   *
   * Handles cleanup of ALL sleep mode entries in the navigation history,
   * not just the active one. Stale sleep entries can accumulate from
   * older sessions (fixed in serialization, but we also handle it here
   * defensively for existing user data).
   */
  wakeUp(): void {
    if (!this.tab.asleep) return;

    const navigationHistory = this.tab.webContents.navigationHistory;
    const activeIndex = navigationHistory.getActiveIndex();
    const currentEntry = navigationHistory.getEntryAtIndex(activeIndex);

    if (currentEntry && currentEntry.url === SLEEP_MODE_URL) {
      // Find the nearest non-sleep entry to navigate to (prefer going back)
      let targetIndex = -1;
      for (let i = activeIndex - 1; i >= 0; i--) {
        const entry = navigationHistory.getEntryAtIndex(i);
        if (entry && entry.url !== SLEEP_MODE_URL) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex >= 0) {
        // Navigate to the target entry
        navigationHistory.goToIndex(targetIndex);

        // After navigation completes, remove ALL sleep entries
        setTimeout(() => {
          // Collect sleep entry indices (iterate in reverse to remove safely)
          const allEntries = navigationHistory.getAllEntries();
          for (let i = allEntries.length - 1; i >= 0; i--) {
            if (allEntries[i].url === SLEEP_MODE_URL) {
              navigationHistory.removeEntryAtIndex(i);
            }
          }
          this.tab.updateTabState();
        }, 100);
      }
    }

    this.tab.updateStateProperty("asleep", false);
    this.preSleepState = null;
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

      setTimeout(() => {
        this.tab.webContents.executeJavaScript(`if (document.fullscreenElement) { document.exitFullscreen(); }`, true);
      }, 100);
    }

    return true;
  }

  /**
   * Sets up fullscreen event listeners on the tab's webContents.
   * Should be called once during tab initialization.
   */
  setupFullScreenListeners(window: BrowserWindow): void {
    const { webContents } = this.tab;
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

    const disconnectLeaveFullScreen = window.connect("leave-full-screen", () => {
      this.setFullScreen(false);
      this.tab.emit("fullscreen-changed", false);
    });

    this.tab.on("destroyed", () => {
      if (window.isEmitterDestroyed()) return;
      disconnectLeaveFullScreen();
    });
  }

  // --- Picture-in-Picture ---

  /**
   * Attempts to exit picture-in-picture mode for this tab.
   * Used when a tab becomes visible again.
   */
  async exitPictureInPicture(): Promise<boolean> {
    // This function runs in the renderer context
    const exitPiP = function () {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
        return true;
      }
      return false;
    };

    try {
      const result = await this.tab.webContents.executeJavaScript(`(${exitPiP})()`, true);
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
      const result = await this.tab.webContents.executeJavaScript(`(${enterPiP})()`, true);
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
