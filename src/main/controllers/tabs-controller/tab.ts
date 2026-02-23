import { cacheFavicon } from "@/modules/favicons";
import { FLAGS } from "@/modules/flags";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { NavigationEntry, Session, WebContents, WebContentsView, WebPreferences } from "electron";
import { createTabContextMenu } from "./context-menu";
import { generateID, getCurrentTimestamp } from "@/modules/utils";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { LoadedProfile } from "@/controllers/loaded-profiles-controller";
import { type TabsController } from "./index";

// Configuration
const TAB_ZINDEX = 2;

export const SLEEP_MODE_URL = "about:blank?sleep=true";

// Interfaces and Types
interface PatchedWebContentsView extends WebContentsView {
  destroy: () => void;
}

type TabStateProperty =
  | "visible"
  | "isDestroyed"
  | "faviconURL"
  | "fullScreen"
  | "isPictureInPicture"
  | "asleep"
  | "lastActiveAt"
  | "position";
type TabContentProperty = "title" | "url" | "isLoading" | "audible" | "muted" | "navHistory" | "navHistoryIndex";

export type TabPublicProperty = TabStateProperty | TabContentProperty;

export type TabEvents = {
  "space-changed": [];
  "window-changed": [];
  "fullscreen-changed": [boolean];
  "new-tab-requested": [
    string,
    "new-window" | "foreground-tab" | "background-tab" | "default" | "other",
    Electron.WebContentsViewConstructorOptions | undefined,
    Electron.HandlerDetails | undefined
  ];
  focused: [];
  // Updated property keys
  updated: [TabPublicProperty[]];
  destroyed: [];
};

export interface TabCreationDetails {
  // Controllers
  tabsController: TabsController;

  // Properties
  profileId: string;
  spaceId: string;

  // Session
  session: Session;

  // Loaded Profile
  loadedProfile: LoadedProfile;
}

export interface TabCreationOptions {
  uniqueId?: string;
  window: BrowserWindow;
  webContentsViewOptions?: Electron.WebContentsViewConstructorOptions;

  // Options
  url?: string;
  asleep?: boolean;
  position?: number;

  // Old States to be restored
  title?: string;
  faviconURL?: string;
  navHistory?: NavigationEntry[];
  navHistoryIndex?: number;
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

    // nodeIntegration = false and nodeIntegrationInSubFrames = true disables node in renderer + enable preload scripts in iframes
    // https://github.com/electron/electron/issues/22582#issuecomment-704247482
    nodeIntegration: false,
    nodeIntegrationInSubFrames: true,
    contextIsolation: true

    // Provide access to 'flow' globals (replaced by implementation in protocols.ts)
    // preload: PATHS.PRELOAD
  };

  const webContentsView = new WebContentsView({
    webPreferences,
    // Only add webContents if it is provided
    ...(webContents ? { webContents } : {})
  });

  webContentsView.setVisible(false);
  return webContentsView as PatchedWebContentsView;
}

/**
 * Tab class — owns identity, state, WebContentsView, and event emission.
 *
 * Does NOT own:
 * - Layout/bounds (TabLayoutManager)
 * - Sleep/wake/fullscreen/PiP lifecycle (TabLifecycleManager)
 * - Persistence (TabPersistenceManager listens to events)
 * - New tab creation (emits "new-tab-requested", TabsController handles it)
 */
export class Tab extends TypedEventEmitter<TabEvents> {
  // Identity
  public readonly id: number;
  public groupId: string | null = null;
  public readonly profileId: string;
  public spaceId: string;
  public readonly uniqueId: string;

  // State properties
  public visible: boolean = false;
  public isDestroyed: boolean = false;
  public faviconURL: string | null = null;
  public fullScreen: boolean = false;
  public isPictureInPicture: boolean = false;
  public asleep: boolean = false;
  public createdAt: number;
  public lastActiveAt: number;
  public position: number;

  // Content properties (from WebContents)
  public title: string = "New Tab";
  public url: string = "";
  public isLoading: boolean = false;
  public audible: boolean = false;
  public muted: boolean = false;
  public navHistory: NavigationEntry[] = [];
  public navHistoryIndex: number = 0;

  // Cached for nav history diff (avoids JSON.stringify every time)
  private lastNavHistoryLength: number = 0;
  private lastNavHistoryIndex: number = 0;

  // View & content objects
  public readonly view: PatchedWebContentsView;
  public readonly webContents: WebContents;

  // Private properties
  private readonly session: Session;
  public readonly loadedProfile: LoadedProfile;
  private window: BrowserWindow;
  // Kept for context menu setup; will be removed when context menu is refactored
  private readonly tabsController: TabsController;

  /**
   * Creates a new tab instance.
   *
   * The constructor handles:
   * - WebContentsView creation
   * - Navigation history restoration
   * - Window setup
   * - Event listener wiring
   * - Extensions registration
   *
   * Sleep and initial URL loading are deferred to setImmediate so the
   * TabsController can finish wiring up the lifecycle/layout managers first.
   */
  constructor(details: TabCreationDetails, options: TabCreationOptions) {
    super();

    const { tabsController, profileId, spaceId, session } = details;

    this.tabsController = tabsController;
    this.profileId = profileId;
    this.spaceId = spaceId;
    this.session = session;

    // Options
    const {
      window,
      webContentsViewOptions = {},
      asleep = false,
      position,
      title,
      faviconURL,
      navHistory = [],
      navHistoryIndex,
      uniqueId
    } = options;

    this.uniqueId = uniqueId || generateID();

    // Position: if not provided, the caller (TabsController) should have computed it
    if (position !== undefined) {
      this.position = position;
    } else {
      const smallestPosition = tabsController.getSmallestPosition();
      this.position = smallestPosition - 1;
    }

    // Create WebContentsView
    const webContentsView = createWebContentsView(session, webContentsViewOptions);
    const webContents = webContentsView.webContents;

    this.id = webContents.id;
    this.view = webContentsView;
    this.webContents = webContents;

    // Restore navigation history (deferred to let managers wire up)
    const restoreNavHistory = navHistory.length > 0;
    if (restoreNavHistory) {
      setImmediate(() => {
        const restoringEntries = [...navHistory];
        let restoringIndex = navHistoryIndex;

        // Add sleep mode entry if asleep to avoid navigating to the real URL
        if (asleep) {
          const newIndex = navHistoryIndex !== undefined ? navHistoryIndex + 1 : restoringEntries.length - 1;
          restoringEntries.splice(newIndex, 0, {
            url: SLEEP_MODE_URL,
            title: ""
          });
          restoringIndex = newIndex;
        }

        this.webContents.navigationHistory.restore({
          entries: restoringEntries,
          index: restoringIndex
        });
      });
    }

    // Restore visual states (deferred)
    setImmediate(() => {
      if (title) {
        this.title = title;
      }
      if (faviconURL) {
        this.updateStateProperty("faviconURL", faviconURL);
      }
    });

    // Set creation time
    this.createdAt = getCurrentTimestamp();
    this.lastActiveAt = this.createdAt;

    // Setup window
    this.setWindow(window);
    this.window = window;

    // Store whether we need initial sleep/load (TabsController reads these after construction)
    this._needsInitialSleep = asleep;
    this._needsInitialLoad = !restoreNavHistory;

    // Set window open handler — emit event instead of calling controller directly
    this.webContents.setWindowOpenHandler((handlerDetails) => {
      switch (handlerDetails.disposition) {
        case "foreground-tab":
        case "background-tab":
        case "new-window": {
          return {
            action: "allow",
            outlivesOpener: true,
            createWindow: (constructorOptions) => {
              // Emit event for the controller to handle
              this.emit(
                "new-tab-requested",
                handlerDetails.url,
                handlerDetails.disposition,
                constructorOptions,
                handlerDetails
              );
              // The controller will create the tab and return its webContents
              // via a synchronous callback pattern
              return this._lastCreatedWebContents!;
            }
          };
        }
        default:
          return { action: "allow" };
      }
    });

    // Setup event listeners
    this.setupEventListeners();

    // Load new tab URL (will be called by TabsController after setup)
    this.loadedProfile = details.loadedProfile;

    // Setup extensions
    const extensions = this.loadedProfile.extensions;
    extensions.addTab(this.webContents, window.browserWindow);

    this.on("updated", () => {
      extensions.tabUpdated(this.webContents);
    });
  }

  // --- Internal state for deferred initialization ---

  /** Whether the tab needs to be put to sleep after construction */
  public _needsInitialSleep: boolean = false;
  /** Whether the tab needs its initial URL loaded */
  public _needsInitialLoad: boolean = false;
  /**
   * Set by the controller when handling "new-tab-requested".
   * The setWindowOpenHandler's createWindow callback reads this synchronously.
   */
  public _lastCreatedWebContents: WebContents | null = null;

  // --- Event Listeners ---

  private setupEventListeners() {
    const { webContents } = this;

    // Set zoom level limits when webContents is ready
    webContents.on("did-finish-load", () => {
      webContents.setVisualZoomLevelLimits(1, 5);
    });

    // Note: Fullscreen listeners are set up by TabLifecycleManager

    // Focus tracking (used by TabsController to determine focused tab)
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

    // Handle devtools open url — emit event instead of calling controller
    webContents.on("devtools-open-url", (_event, url) => {
      this.emit("new-tab-requested", url, "foreground-tab", undefined, undefined);
    });

    // Handle content state changes
    const updateEvents = [
      "audio-state-changed",
      "page-title-updated",
      "did-finish-load",
      "did-start-loading",
      "did-stop-loading",
      "media-started-playing",
      "media-paused",
      "did-start-navigation",
      "did-redirect-navigation",
      "did-navigate-in-page"
    ] as const;

    for (const eventName of updateEvents) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      webContents.on(eventName as any, () => {
        this.updateTabState();
      });
    }

    // Transparent background for internal protocols
    const WHITELISTED_PROTOCOLS = ["flow-internal:", "flow:"];
    const COLOR_TRANSPARENT = "#00000000";
    const COLOR_BACKGROUND = "#ffffffff";
    this.on("updated", (properties) => {
      if (properties.includes("url") && this.url) {
        const url = URL.parse(this.url);
        if (url) {
          if (WHITELISTED_PROTOCOLS.includes(url.protocol)) {
            this.view.setBackgroundColor(COLOR_TRANSPARENT);
          } else {
            this.view.setBackgroundColor(COLOR_BACKGROUND);
          }
        } else {
          this.view.setBackgroundColor(COLOR_BACKGROUND);
        }
      }
    });

    // Handle context menu
    createTabContextMenu(this.tabsController, this, this.profileId, this.window, this.spaceId);
  }

  // --- State Updates ---

  /**
   * Updates a single state property with change detection.
   * Emits "updated" with the changed property key.
   * Does NOT trigger persistence directly — the controller listens for "updated".
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
   * Reads current state from webContents and emits "updated" if anything changed.
   * Uses a smarter nav history comparison (length + index check first)
   * instead of JSON.stringify on every call.
   */
  public updateTabState() {
    if (this.isDestroyed) return false;
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

    // Smart nav history comparison:
    // - fast path on length/index changes
    // - fallback active-entry check for in-place mutations
    //   (e.g. replaceState updates where length/index stay the same)
    const newNavHistory = webContents.navigationHistory.getAllEntries();
    const newNavHistoryIndex = webContents.navigationHistory.getActiveIndex();

    const lengthChanged = newNavHistory.length !== this.lastNavHistoryLength;
    const indexChanged = newNavHistoryIndex !== this.lastNavHistoryIndex;
    let activeEntryChanged = false;

    if (!lengthChanged && !indexChanged) {
      const oldActiveEntry = this.navHistory[this.navHistoryIndex];
      const newActiveEntry = newNavHistory[newNavHistoryIndex];

      activeEntryChanged =
        (oldActiveEntry?.url ?? "") !== (newActiveEntry?.url ?? "") ||
        (oldActiveEntry?.title ?? "") !== (newActiveEntry?.title ?? "");
    }

    if (lengthChanged || indexChanged || activeEntryChanged) {
      this.navHistory = newNavHistory;
      this.navHistoryIndex = newNavHistoryIndex;
      this.lastNavHistoryLength = newNavHistory.length;
      this.lastNavHistoryIndex = newNavHistoryIndex;
      changedKeys.push("navHistory");

      if (indexChanged) {
        changedKeys.push("navHistoryIndex");
      }
    }

    if (changedKeys.length > 0) {
      this.emit("updated", changedKeys);
      return true;
    }
    return false;
  }

  // --- View Management ---

  /**
   * Removes the view from the current window.
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
   * Sets the window for the tab and adds the view to it.
   */
  public setWindow(window: BrowserWindow, index: number = TAB_ZINDEX) {
    const windowChanged = this.window !== window;
    if (windowChanged) {
      this.removeViewFromWindow();
    }

    if (window) {
      this.window = window;
      window.viewManager.addOrUpdateView(this.view, index);
    }

    if (windowChanged) {
      this.emit("window-changed");
    }
  }

  /**
   * Gets the current window for the tab.
   */
  public getWindow() {
    return this.window;
  }

  /**
   * Sets the space for the tab.
   */
  public setSpace(spaceId: string) {
    if (this.spaceId === spaceId) return;
    this.spaceId = spaceId;
    this.emit("space-changed");
  }

  // --- Navigation ---

  /**
   * Loads a URL in the tab.
   */
  public loadURL(url: string, replace?: boolean) {
    if (replace) {
      const sanitizedUrl = JSON.stringify(url);
      this.webContents.executeJavaScript(`window.location.replace(${sanitizedUrl})`);
    } else {
      this.webContents.loadURL(url);
    }
  }

  /**
   * Loads an error page in the tab.
   */
  public loadErrorPage(errorCode: number, url: string) {
    const parsedURL = URL.parse(url);
    if (parsedURL && parsedURL.protocol === "flow:" && parsedURL.hostname === "error") {
      return; // Prevent infinite error page loop
    }

    const errorPageURL = new URL("flow://error");
    errorPageURL.searchParams.set("errorCode", errorCode.toString());
    errorPageURL.searchParams.set("url", url);
    errorPageURL.searchParams.set("initial", "1");

    const replace = FLAGS.ERROR_PAGE_LOAD_MODE === "replace";
    this.loadURL(errorPageURL.toString(), replace);
  }

  // --- Destruction ---

  /**
   * Destroys the tab and cleans up resources.
   * Does NOT handle persistence cleanup — the controller does that
   * by listening to "destroyed".
   */
  public destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.emit("destroyed");

    this.removeViewFromWindow();

    if (!this.webContents.isDestroyed()) {
      this.webContents.close();
    }

    // Note: fullscreen cleanup is handled by TabLifecycleManager.onDestroy()

    this.destroyEmitter();
  }
}
