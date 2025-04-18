import { Browser } from "@/browser/browser";
import { isRectangleEqual, TabBoundsController } from "@/browser/tabs/tab-bounds";
import { TabGroupMode } from "~/types/tabs";
import { GlanceTabGroup } from "@/browser/tabs/tab-groups/glance";
import { NEW_TAB_URL, TabManager } from "@/browser/tabs/tab-manager";
import { TabbedBrowserWindow } from "@/browser/window";
import { cacheFavicon } from "@/modules/favicons";
import { FLAGS } from "@/modules/flags";
import { PATHS } from "@/modules/paths";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { NavigationEntry, Rectangle, Session, WebContents, WebContentsView, WebPreferences } from "electron";
import { createTabContextMenu } from "@/browser/tabs/tab-context-menu";

// Configuration
const GLANCE_FRONT_ZINDEX = 3;
const TAB_ZINDEX = 2;
const GLANCE_BACK_ZINDEX = 0;

// Interfaces and Types
interface PatchedWebContentsView extends WebContentsView {
  destroy: () => void;
}

type TabStateProperty = "visible" | "isDestroyed" | "faviconURL" | "fullScreen" | "isPictureInPicture" | "asleep";
type TabContentProperty = "title" | "url" | "isLoading" | "audible" | "muted" | "navHistory";

type TabPublicProperty = TabStateProperty | TabContentProperty;

type TabEvents = {
  "space-changed": [];
  "window-changed": [];
  focused: [];
  // Updated property keys
  updated: [TabPublicProperty[]];
  destroyed: [];
};

interface TabCreationDetails {
  // Controllers
  browser: Browser;
  tabManager: TabManager;

  // Properties
  profileId: string;
  spaceId: string;

  // Session
  session: Session;
}

interface TabCreationOptions {
  window: TabbedBrowserWindow;
  webContentsViewOptions?: Electron.WebContentsViewConstructorOptions;
  navHistory?: NavigationEntry[];
  asleep?: boolean;
}

function createWebContentsView(
  session: Session,
  options: Electron.WebContentsViewConstructorOptions
): PatchedWebContentsView {
  const webContents = options.webContents;
  const webPreferences: WebPreferences = {
    // Merge with any additional preferences
    ...(options.webPreferences || {}),

    // Basic preferences
    sandbox: true,
    webSecurity: true,
    session: session,
    scrollBounce: true,
    safeDialogs: true,
    navigateOnDragDrop: true,
    transparent: true,

    // Provide access to 'flow' globals
    preload: PATHS.PRELOAD
  };

  const webContentsView = new WebContentsView({
    webPreferences,
    // Only add webContents if it is provided
    ...(webContents ? { webContents } : {})
  });

  webContentsView.setVisible(false);
  return webContentsView as PatchedWebContentsView;
}

// Tab Class
export class Tab extends TypedEventEmitter<TabEvents> {
  // Public properties
  public groupId: number | null = null;
  public readonly id: number;
  public readonly profileId: string;
  public spaceId: string;

  // State properties (Recorded)
  public visible: boolean = false;
  public isDestroyed: boolean = false;
  public faviconURL: string | null = null;
  public fullScreen: boolean = false;
  public isPictureInPicture: boolean = false;
  public asleep: boolean = false;

  // Content properties (From WebContents)
  public title: string = "New Tab";
  public url: string = "";
  public isLoading: boolean = false;
  public audible: boolean = false;
  public muted: boolean = false;
  public navHistory: NavigationEntry[] = [];

  // View & content objects
  public readonly view: PatchedWebContentsView;
  public readonly webContents: WebContents;
  private lastTabGroupMode: TabGroupMode | null = null;

  // Private properties
  private readonly session: Session;
  private readonly browser: Browser;
  private window: TabbedBrowserWindow;
  private readonly tabManager: TabManager;
  private readonly bounds: TabBoundsController;

  /**
   * Creates a new tab instance
   */
  constructor(details: TabCreationDetails, options: TabCreationOptions) {
    super();

    // Create Details
    const {
      // Controllers
      browser,
      tabManager,

      // Properties
      profileId,
      spaceId,

      // Session
      session
    } = details;

    this.browser = browser;
    this.tabManager = tabManager;

    this.profileId = profileId;
    this.spaceId = spaceId;

    this.session = session;

    this.bounds = new TabBoundsController(this);

    // Create Options
    const { window, webContentsViewOptions = {}, navHistory = [], asleep = false } = options;

    // Create WebContentsView
    const webContentsView = createWebContentsView(session, webContentsViewOptions);
    const webContents = webContentsView.webContents;
    this.id = webContents.id;
    this.view = webContentsView;
    this.webContents = webContents;

    // Restore navigation history
    if (navHistory.length > 0) {
      this.webContents.navigationHistory.restore({
        entries: navHistory
      });
    }

    // Put to sleep if requested
    if (asleep) {
      this.putToSleep();
    }

    // Setup window
    this.setWindow(window);
    this.window = window;

    // Set window open handler
    this.webContents.setWindowOpenHandler((details) => {
      switch (details.disposition) {
        case "foreground-tab":
        case "background-tab":
        case "new-window": {
          return {
            action: "allow",
            outlivesOpener: true,
            createWindow: (constructorOptions) => {
              return this.createNewTab(details.url, details.disposition, constructorOptions);
            }
          };
        }
        default:
          return { action: "allow" };
      }
    });

    // Setup event listeners
    this.setupEventListeners();

    // Load new tab URL
    this.loadURL(NEW_TAB_URL);
  }

  private setFullScreen(isFullScreen: boolean) {
    const updated = this.updateStateProperty("fullScreen", isFullScreen);
    if (!updated) return false;

    const tabbedWindow = this.window;
    const window = tabbedWindow.window;

    if (isFullScreen) {
      if (!window.fullScreen) {
        window.setFullScreen(true);
      }
    } else {
      if (window.fullScreen) {
        window.setFullScreen(false);
      }

      setTimeout(() => {
        this.webContents.executeJavaScript(`if (document.fullscreenElement) { document.exitFullscreen(); }`, true);
      }, 100);
    }

    this.updateLayout();

    return true;
  }

  private setupEventListeners() {
    const { webContents, window: tabbedWindow, browser, profileId, spaceId } = this;

    const window = tabbedWindow.window;

    // Handle fullscreen events
    webContents.on("enter-html-full-screen", () => {
      this.setFullScreen(true);
    });

    webContents.on("leave-html-full-screen", () => {
      if (window.fullScreen) {
        // Then it will fire "leave-full-screen", which we can use to exit fullscreen for the tab.
        // Tried other methods, didn't work as well.
        window.setFullScreen(false);
      }
    });

    tabbedWindow.on("leave-full-screen", () => {
      this.setFullScreen(false);
    });

    // Used by the tab manager to determine which tab is focused
    webContents.on("focus", () => {
      this.emit("focused");
    });

    // Handle favicon updates
    webContents.on("page-favicon-updated", (_event, favicons) => {
      const faviconURL = favicons[0];
      const url = this.webContents.getURL();
      if (faviconURL && url) {
        cacheFavicon(url, faviconURL, this.session);
      }
      if (faviconURL && faviconURL !== this.faviconURL) {
        this.updateStateProperty("faviconURL", faviconURL);
      }
    });

    // Handle page load errors
    webContents.on("did-fail-load", (event, errorCode, _errorDescription, validatedURL, isMainFrame) => {
      event.preventDefault();

      // Skip aborted operations (user navigation cancellations)
      if (isMainFrame && errorCode !== -3) {
        this.loadErrorPage(errorCode, validatedURL);
      }
    });

    // Handle content state changes
    const updateEvents = [
      "audio-state-changed", // audible
      "page-title-updated", // title
      "did-finish-load", // url & isLoading
      "did-start-loading", // isLoading
      "did-stop-loading", // isLoading
      "media-started-playing", // audible
      "media-paused", // audible
      "did-start-navigation", // url
      "did-redirect-navigation", // url
      "did-navigate-in-page" // url
    ] as const;

    for (const eventName of updateEvents) {
      webContents.on(eventName as any, () => {
        this.updateTabState();
      });
    }

    // Enable transparent background for whitelisted protocols
    const WHITELISTED_PROTOCOLS = ["flow-internal:", "flow:"];
    const COLOR_TRANSPARENT = "#00000000";
    const COLOR_BACKGROUND = "#ffffffff";
    this.on("updated", (properties) => {
      if (properties.includes("url") && this.url) {
        // @ts-ignore: URL.parse should work, but tsc thinks it doesn't
        const url = URL.parse(this.url);

        if (url) {
          if (WHITELISTED_PROTOCOLS.includes(url.protocol)) {
            this.view.setBackgroundColor(COLOR_TRANSPARENT);
          } else {
            this.view.setBackgroundColor(COLOR_BACKGROUND);
          }
        } else {
          // Bad URL
          this.view.setBackgroundColor(COLOR_BACKGROUND);
        }
      }
    });

    // Handle context menu
    createTabContextMenu(this.browser, this, this.profileId, this.window, this.spaceId);
  }

  public createNewTab(
    url: string,
    disposition: "new-window" | "foreground-tab" | "background-tab" | "default" | "other",
    constructorOptions?: Electron.WebContentsViewConstructorOptions
  ) {
    let windowId = this.window.id;

    const isNewWindow = disposition === "new-window";
    const isForegroundTab = disposition === "foreground-tab";
    const isBackgroundTab = disposition === "background-tab";

    if (isNewWindow) {
      // TODO: popup window instead of standard window
      const newWindow = this.browser.createWindowInternal("normal");
      windowId = newWindow.id;
    }

    const newTab = this.tabManager.internalCreateTab(windowId, this.profileId, this.spaceId, constructorOptions);
    newTab.loadURL(url);

    let glanced = false;

    // Glance if possible
    if (isForegroundTab && FLAGS.GLANCE_ENABLED) {
      const currentTabGroup = this.tabManager.getTabGroupByTabId(this.id);
      if (!currentTabGroup) {
        glanced = true;

        const group = this.tabManager.createTabGroup("glance", [newTab.id, this.id]) as GlanceTabGroup;
        group.setFrontTab(newTab.id);

        this.tabManager.setActiveTab(group);
      }
    }

    if ((isForegroundTab && !glanced) || isBackgroundTab) {
      this.tabManager.setActiveTab(newTab);
    }

    return newTab.webContents;
  }

  /**
   * Updates the tab state property
   */
  public updateStateProperty<T extends TabStateProperty>(property: T, newValue: this[T]) {
    if (this.isDestroyed) return false;

    const currentValue = this[property];
    if (currentValue === newValue) return false;

    this[property] = newValue;
    this.emit("updated", [property]);
    return true;
  }

  /**
   * Updates the tab content state
   */
  public updateTabState() {
    if (this.isDestroyed) return false;

    // If the tab is asleep, the data from the webContents is not reliable.
    if (this.asleep) return false;

    const { webContents } = this;

    const changedKeys: TabContentProperty[] = [];

    const newTitle = webContents.getTitle();
    if (newTitle !== this.title) {
      this.title = newTitle;
      changedKeys.push("title");
    }

    const newUrl = webContents.getURL();
    if (newUrl !== this.url) {
      this.url = newUrl;
      changedKeys.push("url");
    }

    const newIsLoading = webContents.isLoading();
    if (newIsLoading !== this.isLoading) {
      this.isLoading = newIsLoading;
      changedKeys.push("isLoading");
    }

    // Note: webContents.isCurrentlyAudible() might be more accurate than isAudioMuted() sometimes
    const newAudible = webContents.isCurrentlyAudible();
    if (newAudible !== this.audible) {
      this.audible = newAudible;
      changedKeys.push("audible");
    }

    const newMuted = webContents.isAudioMuted();
    if (newMuted !== this.muted) {
      this.muted = newMuted;
      changedKeys.push("muted");
    }

    const newNavHistory = webContents.navigationHistory.getAllEntries();
    const oldNavHistoryJSON = JSON.stringify(this.navHistory);
    const newNavHistoryJSON = JSON.stringify(newNavHistory);
    if (oldNavHistoryJSON !== newNavHistoryJSON) {
      this.navHistory = newNavHistory;
      changedKeys.push("navHistory");
    }

    if (changedKeys.length > 0) {
      this.emit("updated", changedKeys);
      return true;
    }
    return false;
  }

  /**
   * Restores the tab state for the WebContents
   */
  public restoreTabState() {
    this.loadURL(this.url, true);
  }

  /**
   * Puts the tab to sleep
   */
  public putToSleep() {
    if (this.asleep) return;

    this.updateStateProperty("asleep", true);

    // Save current state (To be safe)
    this.updateTabState();

    // Load about:blank to save resources
    this.loadURL("about:blank", true);
  }

  /**
   * Wakes up the tab
   */
  public wakeUp() {
    if (!this.asleep) return;

    // Load the URL to wake up the tab
    this.restoreTabState();

    this.updateStateProperty("asleep", false);
  }

  /**
   * Removes the view from the window
   */
  private removeViewFromWindow() {
    const oldWindow = this.window;
    if (oldWindow) {
      oldWindow.viewManager.removeView(this.view);
      return true;
    }
    return false;
  }

  /**
   * Sets the window for the tab
   */
  public setWindow(window: TabbedBrowserWindow, index: number = TAB_ZINDEX) {
    const windowChanged = this.window !== window;
    if (windowChanged) {
      // Remove view from old window
      this.removeViewFromWindow();
    }

    // Add view to new window
    if (window) {
      this.window = window;
      window.viewManager.addOrUpdateView(this.view, index);
    }

    if (windowChanged) {
      this.emit("window-changed");
    }
  }

  /**
   * Gets the window for the tab
   */
  public getWindow() {
    return this.window;
  }

  /**
   * Sets the space for the tab
   */
  public setSpace(spaceId: string) {
    if (this.spaceId === spaceId) {
      return;
    }

    this.spaceId = spaceId;
    this.emit("space-changed");
  }

  /**
   * Loads a URL in the tab
   */
  public loadURL(url: string, replace?: boolean) {
    if (replace) {
      // Replace mode is not very reliable, don't know if this works :)
      const sanitizedUrl = JSON.stringify(url);
      this.webContents.executeJavaScript(`window.location.replace(${sanitizedUrl})`);
    } else {
      this.webContents.loadURL(url);
    }
  }

  /**
   * Loads an error page in the tab
   */
  public loadErrorPage(errorCode: number, url: string) {
    // Errored on error page? Don't show another error page to prevent infinite loop
    // @ts-ignore: URL.parse should work, but tsc thinks it doesn't
    const parsedURL = URL.parse(url);
    if (parsedURL && parsedURL.protocol === "flow:" && parsedURL.hostname === "error") {
      return;
    }

    // Craft error page URL
    const errorPageURL = new URL("flow://error");
    errorPageURL.searchParams.set("errorCode", errorCode.toString());
    errorPageURL.searchParams.set("url", url);
    errorPageURL.searchParams.set("initial", "1");

    // Load error page
    const replace = FLAGS.ERROR_PAGE_LOAD_MODE === "replace";
    this.loadURL(errorPageURL.toString(), replace);
  }

  /**
   * Calculates the bounds for a tab in glance mode.
   */
  private _calculateGlanceBounds(pageBounds: Rectangle, isFront: boolean): Rectangle {
    const widthPercentage = isFront ? 0.85 : 0.95;
    const heightPercentage = isFront ? 1 : 0.975;

    const newWidth = Math.floor(pageBounds.width * widthPercentage);
    const newHeight = Math.floor(pageBounds.height * heightPercentage);

    // Calculate new x and y to maintain center position
    const xOffset = Math.floor((pageBounds.width - newWidth) / 2);
    const yOffset = Math.floor((pageBounds.height - newHeight) / 2);

    return {
      x: pageBounds.x + xOffset,
      y: pageBounds.y + yOffset,
      width: newWidth,
      height: newHeight
    };
  }

  /**
   * Updates the layout of the tab
   */
  public updateLayout() {
    const { visible, window, tabManager } = this;

    // Ensure visibility is updated first
    if (this.view.getVisible() !== visible) {
      this.view.setVisible(visible);

      // Enter / Exit Picture in Picture mode
      if (visible === true) {
        // This function must be self-contained: it runs in the actual tab's context
        const exitPiP = function () {
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
            return true;
          }
          return false;
        };

        const exitedPiPPromise = this.webContents
          .executeJavaScript(`(${exitPiP})()`, true)
          .then((res) => res === true)
          .catch((err) => {
            console.error("PiP error:", err);
            return false;
          });

        exitedPiPPromise.then((result) => {
          if (result) {
            this.updateStateProperty("isPictureInPicture", false);
          }
        });
      } else {
        // This function must be self-contained: it runs in the actual tab's context
        const enterPiP = async function (tabId: number) {
          const videos = Array.from(document.querySelectorAll("video")).filter(
            (video) => !video.paused && !video.ended && video.readyState > 2
          );

          if (videos.length > 0 && document.pictureInPictureElement !== videos[0]) {
            try {
              const video = videos[0];

              await video.requestPictureInPicture();

              const onLeavePiP = () => {
                // @ts-expect-error: Flow APIs will be available
                flow.tabs.disablePictureInPicture(tabId);
                video.removeEventListener("leavepictureinpicture", onLeavePiP);
              };

              video.addEventListener("leavepictureinpicture", onLeavePiP);
              return true;
            } catch (e) {
              console.error("Failed to enter Picture in Picture mode:", e);
              return false;
            }
          }
        };

        const enteredPiPPromise = this.webContents
          .executeJavaScript(`(${enterPiP})(${this.id})`, true)
          .then((res) => {
            return res === true;
          })
          .catch((err) => {
            console.error("PiP error:", err);
            return false;
          });

        enteredPiPPromise.then((result) => {
          if (result) {
            this.updateStateProperty("isPictureInPicture", true);
          }
        });
      }
    }

    if (!visible) return;

    // Automatically wake tab up if it is asleep
    this.wakeUp();

    // Get base bounds and current group state
    const pageBounds = window.getPageBounds();
    if (this.fullScreen) {
      this.view.setBorderRadius(0);
    } else {
      this.view.setBorderRadius(8);
    }

    const tabGroup = tabManager.getTabGroupByTabId(this.id);

    const lastTabGroupMode = this.lastTabGroupMode;
    let newBounds: Rectangle | null = null;
    let newTabGroupMode: TabGroupMode | null = null;

    let isGlanceFront = false;
    let zIndex = TAB_ZINDEX;

    if (!tabGroup) {
      newTabGroupMode = "normal";
      newBounds = pageBounds;
    } else if (tabGroup.mode === "glance") {
      newTabGroupMode = "glance";
      const isFront = tabGroup.frontTabId === this.id;

      const glanceBounds = this._calculateGlanceBounds(pageBounds, isFront);
      newBounds = glanceBounds;

      if (isFront) {
        isGlanceFront = true;
        zIndex = GLANCE_FRONT_ZINDEX;
      } else {
        zIndex = GLANCE_BACK_ZINDEX;
        // Update glance modal bounds only if this tab is the back tab
        // Avoids unnecessary updates if multiple back tabs exist (though unlikely)
        this.window.glanceModal.setBounds(glanceBounds);
      }
    } else if (tabGroup.mode === "split") {
      newTabGroupMode = "split";
      /* TODO: Implement split tab group layout
      const splitConfig = tabGroup.getTabSplitConfig(this.id); // Hypothetical method

      if (splitConfig) {
        const { x: xPercentage, y: yPercentage, width: widthPercentage, height: heightPercentage } = splitConfig;

        const xOffset = Math.floor(pageBounds.width * xPercentage);
        const yOffset = Math.floor(pageBounds.height * yPercentage);
        const newWidth = Math.floor(pageBounds.width * widthPercentage);
        const newHeight = Math.floor(pageBounds.height * heightPercentage);

        const splitBounds = {
          x: pageBounds.x + xOffset,
          y: pageBounds.y + yOffset,
          width: newWidth,
          height: newHeight
        };

        newBounds = splitBounds;
      }
      */
    }

    // Update Z-index (via setWindow)
    this.setWindow(this.window, zIndex);

    // Update last known mode if changed
    if (newTabGroupMode !== lastTabGroupMode) {
      this.lastTabGroupMode = newTabGroupMode;
    }

    // Manage glance modal visibility
    const showGlanceModal = newTabGroupMode === "glance";
    this.window.glanceModal.setVisible(showGlanceModal);

    // Apply the calculated bounds
    if (newBounds) {
      // Use immediate update if mode hasn't changed AND bounds controller is idle
      const useImmediateUpdate =
        newTabGroupMode === lastTabGroupMode && isRectangleEqual(this.bounds.bounds, this.bounds.targetBounds);

      if (useImmediateUpdate) {
        this.bounds.setBoundsImmediate(newBounds);
      } else {
        this.bounds.setBounds(newBounds);
      }
    }
  }

  /**
   * Shows the tab
   */
  public show() {
    const updated = this.updateStateProperty("visible", true);
    // Already visible
    if (!updated) return;
    this.updateLayout();
  }

  /**
   * Hides the tab
   */
  public hide() {
    const updated = this.updateStateProperty("visible", false);
    // Already hidden
    if (!updated) return;
    this.updateLayout();
  }

  /**
   * Destroys the tab and cleans up resources
   */
  public destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.emit("destroyed");

    this.bounds.destroy();

    this.removeViewFromWindow();
    this.webContents.close();

    if (this.fullScreen) {
      this.window.window.setFullScreen(false);
    }

    this.destroyEmitter();
  }
}
