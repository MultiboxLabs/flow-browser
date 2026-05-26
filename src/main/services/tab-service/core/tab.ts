import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { generateID, getCurrentTimestamp } from "@/modules/utils";
import { NavigationEntry, Session, WebContents, WebContentsView, WebPreferences } from "electron";
import { Layer } from "@/controllers/windows-controller/layer-manager";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { LoadedProfile } from "@/controllers/loaded-profiles-controller";
import { createModalTo, focusPriorities, LayerType, zIndexes } from "~/layers";
import { TabOwnerRef } from "~/types/tab-service";
import { cacheFavicon } from "@/modules/favicons";
import {
  isHistoryRecordableUrl,
  recordBrowsingHistoryVisit,
  updateBrowsingHistoryTitleForOpenPage
} from "@/saving/history/browsing-history";
import { createWebContextMenu } from "./web-context-menu";

export const SLEEP_MODE_URL = "about:blank?sleep=true";

// Stable counter-based tab IDs
let nextTabId = 1;

// --- Types ---

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
  "space-changed": [oldSpaceId: string];
  "window-changed": [oldWindowId: number];
  "fullscreen-changed": [boolean];
  "target-url-changed": [url: string];
  "new-tab-requested": [
    string,
    "new-window" | "foreground-tab" | "background-tab" | "default" | "other",
    Electron.WebContentsViewConstructorOptions | undefined,
    Electron.HandlerDetails | undefined,
    { noLoadURL?: boolean }
  ];
  focused: [];
  updated: [TabPublicProperty[]];
  "content-changed": [];
  destroyed: [];
};

export interface TabCreationDetails {
  profileId: string;
  spaceId: string;
  session: Session;
  loadedProfile: LoadedProfile;
}

export interface TabCreationOptions {
  uniqueId?: string;
  window: BrowserWindow;
  webContentsViewOptions?: Electron.WebContentsViewConstructorOptions;
  createdAt?: number;
  lastActiveAt?: number;
  url?: string;
  asleep?: boolean;
  position?: number;
  owner?: TabOwnerRef;
  title?: string;
  faviconURL?: string;
  navHistory?: NavigationEntry[];
  navHistoryIndex?: number;
  noLoadURL?: boolean;
  typedNavigation?: boolean;
  /** If false, the tab won't be activated after creation (default: true) */
  makeActive?: boolean;
}

function createWebContentsView(session: Session, options: Electron.WebContentsViewConstructorOptions): WebContentsView {
  const webContents = options.webContents;
  const webPreferences: WebPreferences = {
    ...(options.webPreferences || {}),
    sandbox: true,
    webSecurity: true,
    session: session,
    scrollBounce: true,
    safeDialogs: true,
    navigateOnDragDrop: true,
    transparent: true,
    nodeIntegration: false,
    nodeIntegrationInSubFrames: true,
    contextIsolation: true
  };

  const webContentsView = new WebContentsView({
    webPreferences,
    ...(webContents ? { webContents } : {})
  });

  webContentsView.setVisible(false);
  return webContentsView;
}

// Background colors
const COLOR_TRANSPARENT = "#00000000";
const COLOR_BACKGROUND = "#FFFFFF";
const WHITELISTED_PROTOCOLS = ["flow:", "flow-internal:"];

/**
 * Tab — core entity owning identity, state, WebContentsView, and event emission.
 *
 * The view and webContents are nullable: sleeping tabs have no view or
 * webContents to save resources (~20-50MB RAM per sleeping tab).
 */
export class Tab extends TypedEventEmitter<TabEvents> {
  // Identity
  public readonly id: number;
  public readonly profileId: string;
  public spaceId: string;
  public readonly uniqueId: string;

  // Ownership — links this tab to a pinned tab, bookmark, or nothing
  public owner: TabOwnerRef;

  // State
  public visible: boolean = false;
  public isDestroyed: boolean = false;
  public faviconURL: string | null = null;
  public fullScreen: boolean = false;
  public isPictureInPicture: boolean = false;
  public asleep: boolean = false;
  public createdAt: number;
  public lastActiveAt: number;
  public position: number;

  // History dedup
  private pendingHistoryTypedUrl: string | null = null;
  private lastRecordedHistoryKey: string = "";

  // Content properties
  public title: string = "New Tab";
  public url: string = "";
  public isLoading: boolean = false;
  public audible: boolean = false;
  public muted: boolean = false;
  public navHistory: NavigationEntry[] = [];
  public navHistoryIndex: number = 0;

  // Nav history diff cache
  private lastNavHistoryLength: number = 0;
  private lastNavHistoryIndex: number = 0;

  // Coalescing
  private _updatePending: boolean = false;
  private _pendingUpdatedProps: Set<TabPublicProperty> = new Set();

  // Fullscreen cleanup
  private _disconnectLeaveFullScreen: (() => void) | null = null;

  // View & content objects (nullable when asleep)
  public view: WebContentsView | null = null;
  public webContents: WebContents | null = null;
  public layer: Layer<WebContentsView> | null = null;

  // Private
  private readonly session: Session;
  public readonly loadedProfile: LoadedProfile;
  private window!: BrowserWindow;
  private readonly _webContentsViewOptions: Electron.WebContentsViewConstructorOptions;

  /** Signals that the tab's initial loadURL should be called after wiring. */
  public _needsInitialLoad: boolean = false;
  /** Last webContents created by a new-tab-requested event (for window.open). */
  public _lastCreatedWebContents: WebContents | null = null;

  constructor(details: TabCreationDetails, options: TabCreationOptions) {
    super();

    const { profileId, spaceId, session } = details;

    this.profileId = profileId;
    this.spaceId = spaceId;
    this.session = session;
    this.loadedProfile = details.loadedProfile;

    const {
      window,
      webContentsViewOptions = {},
      createdAt,
      lastActiveAt,
      asleep = false,
      position,
      title,
      faviconURL,
      navHistory = [],
      navHistoryIndex,
      uniqueId,
      owner = { kind: "normal" }
    } = options;

    this._webContentsViewOptions = webContentsViewOptions;
    this.uniqueId = uniqueId || generateID();
    this.owner = owner;
    this.id = nextTabId++;

    // Position
    if (position !== undefined) {
      this.position = position;
    } else {
      this.position = -1; // Will be set by TabPositioner
    }

    // Timestamps
    const now = getCurrentTimestamp();
    this.createdAt = createdAt ?? now;
    this.lastActiveAt = lastActiveAt ?? this.createdAt;

    // Restore visual states
    if (title) this.title = title;
    if (faviconURL) this.faviconURL = faviconURL;

    this.window = window;

    if (asleep) {
      this.asleep = true;
      // Nav history stored for pre-sleep state
      if (navHistory.length > 0) {
        this.navHistory = navHistory;
        this.navHistoryIndex = navHistoryIndex ?? navHistory.length - 1;
        if (navHistory[this.navHistoryIndex]) {
          this.url = navHistory[this.navHistoryIndex].url;
        }
      }
    } else {
      this.initializeView();
      this._needsInitialLoad = navHistory.length === 0;

      // Restore nav history on next tick
      if (navHistory.length > 0) {
        setImmediate(() => {
          if (this.isDestroyed) return;
          this.restoreNavigationHistory(navHistory, navHistoryIndex ?? navHistory.length - 1);
        });
      }
    }
  }

  // --- Getters ---

  public get ephemeral(): boolean {
    return this.owner.kind !== "normal";
  }

  public getWindow(): BrowserWindow {
    return this.window;
  }

  // --- Window Management ---

  public setWindow(window: BrowserWindow): void {
    const oldWindowId = this.window?.id;
    if (oldWindowId === window.id) return;

    // Remove from old window
    if (this.layer) {
      this.window?.layerManager?.pop(this.layer);
    }

    this.window = window;

    // Add to new window
    if (this.view && this.layer) {
      window.layerManager?.push(this.layer);
    } else if (this.view) {
      this.layer = new Layer(window.layerManager, this.view, zIndexes.tab, focusPriorities.tab, createModalTo("tab"));
      window.layerManager?.push(this.layer);
    }

    // Update the extensions library's internal window mapping for this tab.
    // The library has no public moveTab API, so we patch the store directly.
    if (this.webContents && !this.webContents.isDestroyed()) {
      const store = (
        this.loadedProfile.extensions as unknown as {
          ctx: { store: { tabToWindow: WeakMap<WebContents, Electron.BaseWindow> } };
        }
      ).ctx.store;
      store.tabToWindow.set(this.webContents, window.browserWindow);
    }

    // Re-attach fullscreen listener to new window
    if (this.view) {
      this.setupWindowFullScreenListener();
    }

    if (oldWindowId !== undefined) {
      this.emit("window-changed", oldWindowId);
    }
  }

  /**
   * Change the layer type (z-index) of this tab's layer.
   * Used for glance mode: front tab = "tab" (z10), back tab = "tabBack" (z9).
   */
  public setLayerType(layerType: LayerType): void {
    if (!this.view || !this.layer || !this.window) return;
    if (this.layer.zIndex === zIndexes[layerType]) return;

    const lm = this.window.layerManager;
    if (!lm) return;

    const wasVisible = this.layer.isVisible();
    lm.pop(this.layer);
    this.layer = new Layer(lm, this.view, zIndexes[layerType], focusPriorities[layerType], createModalTo(layerType));
    lm.push(this.layer);
    this.layer.setVisible(wasVisible);
  }

  public notifyExtensionsOfChanges(): void {
    if (!this.webContents || this.webContents.isDestroyed()) return;

    // electron-chrome-extensions listens to this event to update its internal state
    this.webContents.emit("tab-updated");
  }

  // --- Space Management ---

  public setSpace(spaceId: string): void {
    if (this.spaceId === spaceId) return;
    const oldSpaceId = this.spaceId;
    this.spaceId = spaceId;
    this.emit("space-changed", oldSpaceId);
  }

  // --- View Management ---

  public initializeView(): void {
    const view = createWebContentsView(this.session, this._webContentsViewOptions);
    this.view = view;
    this.webContents = view.webContents;

    // Create layer
    this.layer = new Layer(this.window.layerManager, view, zIndexes.tab, focusPriorities.tab, createModalTo("tab"));
    this.window.layerManager.push(this.layer);

    this.setupWebContentsListeners();
    this.setupWindowFullScreenListener();

    // Setup web page context menu (right-click on page content)
    createWebContextMenu(this, this.window);

    // Register with extensions
    const extensions = this.loadedProfile.extensions;
    extensions.addTab(this.webContents, this.window?.browserWindow);
  }

  public teardownView(): void {
    if (!this.view) return;

    // Disconnect window fullscreen listener
    if (this._disconnectLeaveFullScreen) {
      this._disconnectLeaveFullScreen();
      this._disconnectLeaveFullScreen = null;
    }

    // Remove layer from window
    if (this.layer) {
      this.window?.layerManager?.pop(this.layer);
      this.layer = null;
    }

    // Null references before closing so getTabByWebContents() won't find
    // this tab during the extensions library's "destroyed" callback.
    const wc = this.webContents;
    this.view = null;
    this.webContents = null;

    if (wc && !wc.isDestroyed()) {
      wc.close();
    }
  }

  // --- Sleep / Wake ---

  public putToSleep(): void {
    if (this.asleep) return;

    this.updateTabState();

    // Capture nav state before tearing down
    if (this.webContents && !this.webContents.isDestroyed()) {
      const history = this.webContents.navigationHistory;
      const count = history.length();
      const entries: NavigationEntry[] = [];
      for (let i = 0; i < count; i++) {
        const entry = history.getEntryAtIndex(i);
        entries.push({ title: entry.title || "", url: entry.url, pageState: entry.pageState });
      }
      this.navHistory = entries;
      this.navHistoryIndex = history.getActiveIndex();
    }

    this.updateStateProperty("asleep", true);
    this.teardownView();
  }

  public wakeUp(): void {
    if (!this.asleep) return;

    this.initializeView();
    this.updateStateProperty("asleep", false);

    if (this.navHistory.length > 0) {
      this.restoreNavigationHistory(this.navHistory, this.navHistoryIndex);
    }

    this.applyUrlBackground();
  }

  // --- Picture in Picture ---

  public async enterPictureInPicture(): Promise<boolean> {
    if (!this.webContents || this.webContents.isDestroyed()) return false;

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
              flow.tabService.disablePictureInPicture(goBackToTab);
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
      return false;
    };

    try {
      const result = await this.webContents.executeJavaScript(`(${enterPiP})()`, true);
      if (result) {
        this.updateStateProperty("isPictureInPicture", true);
      }
      return result;
    } catch (err) {
      console.error("PiP enter error:", err);
      return false;
    }
  }

  public async exitPictureInPicture(): Promise<boolean> {
    if (!this.webContents || this.webContents.isDestroyed()) return false;

    const exitPiP = function () {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
        return true;
      }
      return false;
    };

    try {
      const result = await this.webContents.executeJavaScript(`(${exitPiP})()`, true);
      if (result) {
        this.updateStateProperty("isPictureInPicture", false);
      }
      return result;
    } catch (err) {
      console.error("PiP exit error:", err);
      return false;
    }
  }

  // --- Fullscreen ---

  public setFullScreen(isFullScreen: boolean): void {
    const updated = this.updateStateProperty("fullScreen", isFullScreen);
    if (!updated) return;

    const window = this.getWindow();
    if (window.destroyed) return;
    const electronWindow = window.browserWindow;

    if (isFullScreen) {
      if (!electronWindow.fullScreen) {
        electronWindow.setFullScreen(true);
      }
    } else {
      if (electronWindow.fullScreen) {
        electronWindow.setFullScreen(false);
      }

      // Nudge the view bounds by 1px to force Chromium to recognize the
      // viewport change, which is needed to properly exit HTML fullscreen.
      const view = this.view;
      if (view) {
        setTimeout(() => {
          if (this.view !== view || !this.visible) return;

          const bounds = view.getBounds();
          const nudged = { ...bounds, width: bounds.width - 1 };
          view.setBounds(nudged);

          setTimeout(() => {
            if (this.view !== view || !this.visible) return;
            const current = view.getBounds();
            if (current.width !== nudged.width || current.height !== nudged.height) return;
            if (current.x !== nudged.x || current.y !== nudged.y) return;
            view.setBounds(bounds);
          }, 50);
        }, 800);
      }

      if (this.webContents && !this.webContents.isDestroyed()) {
        this.webContents.executeJavaScript(`if (document.fullscreenElement) { document.exitFullscreen(); }`, true);
      }
    }
    this.emit("fullscreen-changed", isFullScreen);
  }

  /**
   * Listens for the OS window exiting fullscreen and syncs tab state accordingly.
   * Idempotent: disconnects any previous listener before registering.
   */
  private setupWindowFullScreenListener(): void {
    if (this._disconnectLeaveFullScreen) {
      this._disconnectLeaveFullScreen();
      this._disconnectLeaveFullScreen = null;
    }

    const window = this.window;
    if (!window || window.destroyed) return;

    const handler = () => {
      this.setFullScreen(false);
    };
    window.on("leave-full-screen", handler);

    this._disconnectLeaveFullScreen = () => {
      if (!window.destroyed) {
        window.off("leave-full-screen", handler);
      }
    };
  }

  // --- State Updates ---

  public updateStateProperty<K extends TabStateProperty>(key: K, value: this[K]): boolean {
    if ((this as Record<string, unknown>)[key] === value) return false;
    (this as Record<string, unknown>)[key] = value;
    this.scheduleUpdate([key]);
    return true;
  }

  public updateTabState(): void {
    if (!this.webContents || this.webContents.isDestroyed()) return;

    const changed: TabPublicProperty[] = [];
    const wc = this.webContents;

    const newTitle = wc.getTitle() || "New Tab";
    if (this.title !== newTitle) {
      this.title = newTitle;
      changed.push("title");
    }

    const newUrl = wc.getURL();
    if (this.url !== newUrl) {
      this.url = newUrl;
      changed.push("url");
    }

    const newIsLoading = wc.isLoading();
    if (this.isLoading !== newIsLoading) {
      this.isLoading = newIsLoading;
      changed.push("isLoading");
    }

    const newAudible = wc.isCurrentlyAudible();
    if (this.audible !== newAudible) {
      this.audible = newAudible;
      changed.push("audible");
    }

    const newMuted = wc.isAudioMuted();
    if (this.muted !== newMuted) {
      this.muted = newMuted;
      changed.push("muted");
    }

    // Nav history diff
    const entries = wc.navigationHistory.getAllEntries();
    const currentIndex = wc.navigationHistory.getActiveIndex();
    if (entries.length !== this.lastNavHistoryLength || currentIndex !== this.lastNavHistoryIndex) {
      this.navHistory = entries.map((e) => ({ title: e.title || "", url: e.url, pageState: e.pageState }));
      this.navHistoryIndex = currentIndex;
      this.lastNavHistoryLength = entries.length;
      this.lastNavHistoryIndex = currentIndex;
      changed.push("navHistory", "navHistoryIndex");
    }

    if (changed.length > 0) {
      this.scheduleUpdate(changed);
    }
  }

  /**
   * Polls Chromium's navigation entries for in-place pageState changes
   * (scroll position, form values, etc.) that update without events.
   * Returns true if any entry was updated.
   */
  public pollPageState(): boolean {
    if (!this.webContents || this.webContents.isDestroyed() || this.asleep) return false;

    const entries = this.webContents.navigationHistory.getAllEntries();
    if (entries.length !== this.navHistory.length) return false;

    let changed = false;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].pageState !== this.navHistory[i].pageState) {
        this.navHistory[i] = { ...this.navHistory[i], pageState: entries[i].pageState };
        changed = true;
      }
    }

    if (changed) {
      this.emit("content-changed");
    }
    return changed;
  }

  private scheduleUpdate(properties: TabPublicProperty[]): void {
    for (const prop of properties) {
      this._pendingUpdatedProps.add(prop);
    }
    if (this._updatePending) return;
    this._updatePending = true;
    queueMicrotask(() => {
      this._updatePending = false;
      const merged = Array.from(this._pendingUpdatedProps);
      this._pendingUpdatedProps.clear();
      if (!this.isDestroyed) {
        this.emit("updated", merged);
      }
    });
  }

  // --- Navigation ---

  public loadURL(url: string): void {
    if (!this.webContents || this.webContents.isDestroyed()) return;
    this.webContents.loadURL(url).catch(() => {
      // Navigation cancelled or failed — ignore
    });
  }

  public loadErrorPage(errorCode: number, url: string): void {
    const parsedURL = URL.parse(url);
    if (parsedURL && parsedURL.protocol === "flow:" && parsedURL.hostname === "error") {
      return; // Prevent infinite error page loop
    }

    const errorPageURL = new URL("flow://error");
    errorPageURL.searchParams.set("errorCode", errorCode.toString());
    errorPageURL.searchParams.set("url", url);
    errorPageURL.searchParams.set("initial", "1");

    this.loadURL(errorPageURL.toString());
  }

  public restoreNavigationHistory(entries: NavigationEntry[], activeIndex: number): void {
    if (!this.webContents || this.webContents.isDestroyed()) return;

    this.webContents.navigationHistory.restore({
      entries: entries.map((e) => ({ url: e.url, title: e.title, pageState: e.pageState })),
      index: activeIndex
    });
  }

  // --- URL Background ---

  public applyUrlBackground(): void {
    if (!this.view) return;
    const parsedUrl = URL.parse(this.url);
    if (parsedUrl && WHITELISTED_PROTOCOLS.includes(parsedUrl.protocol || "")) {
      this.view.setBackgroundColor(COLOR_TRANSPARENT);
    } else {
      this.view.setBackgroundColor(COLOR_BACKGROUND);
    }
  }

  // --- History Recording ---

  public markTypedNavigationForNextHistoryVisit(url: string): void {
    this.pendingHistoryTypedUrl = url;
  }

  public recordBrowsingHistoryOnActivationIfNeeded(): void {
    if (!this.webContents || this.webContents.isDestroyed()) return;
    const url = this.url;
    if (!isHistoryRecordableUrl(url)) return;

    const key = `${url}|${this.title}`;
    if (key === this.lastRecordedHistoryKey) return;
    this.lastRecordedHistoryKey = key;

    const typed = this.pendingHistoryTypedUrl === url;
    if (typed) this.pendingHistoryTypedUrl = null;

    recordBrowsingHistoryVisit({
      profileId: this.profileId,
      url,
      title: this.title,
      incrementTyped: typed
    });
  }

  public clearBrowsingHistoryDeduping(url?: string): void {
    if (!url) {
      this.lastRecordedHistoryKey = "";
      return;
    }
    if (this.lastRecordedHistoryKey.startsWith(`${url}|`)) {
      this.lastRecordedHistoryKey = "";
    }
  }

  // --- Lifecycle ---

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Exit OS fullscreen if this tab is currently fullscreen
    if (this.fullScreen) {
      const window = this.window;
      if (window && !window.destroyed) {
        window.browserWindow.setFullScreen(false);
      }
    }

    // Unregister from extensions (only on destroy, not sleep)
    if (this.webContents && !this.webContents.isDestroyed()) {
      this.loadedProfile.extensions.removeTab(this.webContents);
    }

    this.teardownView();
    this.emit("destroyed");
    this.destroyEmitter();
  }

  // --- Private Listener Setup ---

  private setupWebContentsListeners(): void {
    if (!this.webContents) return;
    const wc = this.webContents;

    wc.on("did-start-loading", () => this.updateTabState());
    wc.on("did-stop-loading", () => this.updateTabState());
    wc.on("did-start-navigation", () => this.updateTabState());
    wc.on("did-navigate", () => {
      this.updateTabState();
      this.applyUrlBackground();
      this.recordBrowsingHistoryOnActivationIfNeeded();
    });
    wc.on("did-navigate-in-page", () => this.updateTabState());
    wc.on("page-title-updated", () => {
      this.updateTabState();
      if (isHistoryRecordableUrl(this.url)) {
        updateBrowsingHistoryTitleForOpenPage({
          profileId: this.profileId,
          url: this.url,
          title: this.title
        });
      }
    });
    wc.on("page-favicon-updated", (_event, favicons) => {
      if (favicons.length > 0) {
        const newFavicon = favicons[0];
        if (this.faviconURL !== newFavicon) {
          this.faviconURL = newFavicon;
          this.scheduleUpdate(["faviconURL"]);
          cacheFavicon(this.url, newFavicon, this.session);
        }
      }
    });
    wc.on("audio-state-changed", () => this.updateTabState());

    wc.on("did-fail-load", (event, errorCode, _errorDescription, validatedURL, isMainFrame) => {
      event.preventDefault();
      // Skip aborted operations (user navigation cancellations)
      if (isMainFrame && errorCode !== -3) {
        this.loadErrorPage(errorCode, validatedURL);
      }
    });

    wc.on("devtools-open-url", (_event, url) => {
      this.emit("new-tab-requested", url, "foreground-tab", undefined, undefined, { noLoadURL: false });
    });

    wc.on("update-target-url", (_event, url) => {
      this.emit("target-url-changed", url);
    });

    wc.on("focus", () => this.emit("focused"));

    // New window/tab requests
    wc.setWindowOpenHandler((details) => {
      const disposition = details.disposition;
      const url = details.url;

      if (disposition === "new-window" || disposition === "foreground-tab" || disposition === "background-tab") {
        return {
          action: "allow",
          outlivesOpener: true,
          createWindow: (constructorOptions) => {
            const viewOptions = constructorOptions as Electron.WebContentsViewConstructorOptions;
            const needsManualLoad = !viewOptions.webContents;
            this.emit("new-tab-requested", url, disposition, viewOptions, details, {
              noLoadURL: !needsManualLoad
            });
            return this._lastCreatedWebContents!;
          }
        };
      }

      return { action: "allow" };
    });

    // Fullscreen
    wc.on("enter-html-full-screen", () => {
      this.setFullScreen(true);
    });
    wc.on("leave-html-full-screen", () => {
      this.setFullScreen(false);
    });
  }
}
