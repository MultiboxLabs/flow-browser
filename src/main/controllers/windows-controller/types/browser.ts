import { BaseWindow, BaseWindowEvents } from "@/controllers/windows-controller/types/base";
import { BrowserWindow as ElectronBrowserWindow, nativeTheme, WebContents } from "electron";
import { type PageBounds } from "@/ipc/browser/page";
import { appMenuController } from "@/controllers/app-menu-controller";
import { ViewManager } from "@/controllers/windows-controller/utils/view-manager";
import { Omnibox } from "@/controllers/windows-controller/utils/browser/omnibox";
import { initializePortalComponentWindows } from "@/controllers/windows-controller/utils/browser/portal-component-windows";
import { sendMessageToListenersWithWebContents } from "@/ipc/listeners-manager";
import { fireWindowStateChanged } from "@/ipc/browser/interface";
import { tabsController } from "@/controllers/tabs-controller";
import { sessionsController } from "@/controllers/sessions-controller";
import { spacesController } from "@/controllers/spaces-controller";
import { tabPersistenceManager } from "@/saving/tabs";

export type BrowserWindowType = "normal" | "popup";

export interface BrowserWindowCreationOptions {
  height?: number;
  width?: number;
  x?: number;
  y?: number;
}

type BaseWindowInstance = InstanceType<typeof BaseWindow>;

interface BrowserWindowEvents extends BaseWindowEvents {
  "page-bounds-changed": [bounds: PageBounds];
  "current-space-changed": [spaceId: string];
  "leave-full-screen": [];
}

export class BrowserWindow extends BaseWindow<BrowserWindowEvents> {
  public browserWindowType: BrowserWindowType;
  public viewManager: ViewManager;
  public coreWebContents: WebContents[];
  public omnibox: Omnibox;

  constructor(type: BrowserWindowType, options: BrowserWindowCreationOptions = {}) {
    // const hasSizeOptions = "width" in options || "height" in options;
    const hasPositionOptions = options.x !== undefined || options.y !== undefined;

    const browserWindow = new ElectronBrowserWindow({
      minWidth: type === "normal" ? 800 : 250,
      minHeight: type === "normal" ? 400 : 200,

      width: options.width ?? 1280,
      height: options.height ?? 720,

      x: options.x,
      y: options.y,
      center: hasPositionOptions ? false : true,

      titleBarStyle: process.platform === "darwin" ? "hidden" : undefined,
      titleBarOverlay: {
        height: 30,
        symbolColor: nativeTheme.shouldUseDarkColors ? "white" : "black",
        color: "rgba(0,0,0,0)"
      },

      webPreferences: {
        sandbox: true,
        nodeIntegration: false,
        contextIsolation: true
      },

      title: "Flow",
      frame: false,
      transparent: false,
      resizable: true,
      show: false,
      roundedCorners: true,

      backgroundColor: process.platform === "darwin" ? "#00000000" : "#000000",
      visualEffectState: "followWindow",
      vibrancy: "fullscreen-ui", // on MacOS
      backgroundMaterial: "none" // on Windows (Disabled as it interferes with rounded corners)
    });

    // Wait for default session to be ready
    sessionsController.whenDefaultSessionReady().then(() => {
      // Load the correct UI
      if (type === "normal") {
        browserWindow.loadURL("flow-internal://main-ui/");
      } else if (type === "popup") {
        browserWindow.loadURL("flow-internal://popup-ui/");
      }
    });

    super("browser", browserWindow, { showAfterLoad: true });

    this.browserWindowType = type;

    // "leave-full-screen" event
    browserWindow.on("leave-full-screen", () => {
      this.emit("leave-full-screen");
      this._updateMacOSTrafficLights();
      fireWindowStateChanged(this);
    });

    // Persist window bounds on resize/move so the size is restored on next launch
    let boundsDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    const persistWindowBounds = () => {
      if (boundsDebounceTimer) clearTimeout(boundsDebounceTimer);
      boundsDebounceTimer = setTimeout(() => {
        const bounds = browserWindow.getBounds();
        tabPersistenceManager.markWindowStateDirty(`w-${this.id}`, {
          width: bounds.width,
          height: bounds.height,
          x: bounds.x,
          y: bounds.y,
          isPopup: type === "popup" ? true : undefined
        });
      }, 500);
    };
    browserWindow.on("resize", persistWindowBounds);
    browserWindow.on("move", persistWindowBounds);

    // Persist initial bounds immediately so restored windows maintain their state
    // even if the user doesn't resize/move them. This is needed because the window
    // ID changes across sessions, so the windowGroupId in the DB needs to be updated.
    persistWindowBounds();

    // Recompute page bounds directly on resize — bypasses the renderer IPC
    // round-trip (~50-70ms latency from ResizeObserver → rAF → React → IPC).
    // The renderer still sends bounds for structural layout changes (sidebar,
    // toolbar), but resize is handled instantly using cached insets.
    browserWindow.on("resize", () => {
      // Mark resize as active and debounce the end
      this._isResizing = true;
      if (this._resizeEndTimer) clearTimeout(this._resizeEndTimer);
      this._resizeEndTimer = setTimeout(() => {
        this._isResizing = false;
      }, 150);

      if (!this.pageInsets) return; // No bounds received from renderer yet
      const [contentWidth, contentHeight] = this.browserWindow.getContentSize();
      const newBounds: PageBounds = {
        x: this.pageInsets.left,
        y: this.pageInsets.top,
        width: Math.max(0, contentWidth - this.pageInsets.left - this.pageInsets.right),
        height: Math.max(0, contentHeight - this.pageInsets.top - this.pageInsets.bottom)
      };
      this.pageBounds = newBounds;
      this.emit("page-bounds-changed", newBounds);
      tabsController.handlePageBoundsChanged(this.id);
    });

    // View Manager //
    this.viewManager = new ViewManager(browserWindow.contentView);
    this.coreWebContents = [browserWindow.webContents];

    // Omnibox //
    this.omnibox = new Omnibox(browserWindow);
    this.viewManager.addOrUpdateView(this.omnibox.view, 999);
    this.coreWebContents.push(this.omnibox.webContents);

    // Set Initial Space //
    spacesController.getLastUsed().then((space) => {
      if (space && !this.currentSpaceId) {
        this.setCurrentSpace(space.id);
      }
    });

    // Portal Components //
    initializePortalComponentWindows(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public sendMessageToCoreWebContents(channel: string, ...args: any[]) {
    return sendMessageToListenersWithWebContents(this.coreWebContents, channel, ...args);
  }

  // macOS Traffic Lights Handling //
  private trafficLightsVisibility: boolean = true;

  private _updateMacOSTrafficLights() {
    const window = this.browserWindow;

    if ("setWindowButtonVisibility" in window) {
      if (window.fullScreen) {
        // Set to true while in fullscreen
        // Otherwise users won't be able to close the window
        window.setWindowButtonVisibility(true);
      } else {
        window.setWindowButtonVisibility(this.trafficLightsVisibility);
      }
    }
  }

  setMacOSTrafficLights(visible: boolean) {
    this.trafficLightsVisibility = visible;
    this._updateMacOSTrafficLights();
  }

  // Page Bounds (Used for Tabs) //
  public pageBounds: PageBounds = { x: 0, y: 0, width: 0, height: 0 };

  // Stored insets so the main process can recompute page bounds on resize
  // without waiting for the renderer round-trip (~50-70ms latency).
  private pageInsets: { top: number; left: number; right: number; bottom: number } | null = null;

  // Tracks whether a resize is in progress. While resizing, the main process
  // resize handler is the source of truth — stale renderer IPC is suppressed
  // to prevent flickering (renderer bounds are ~50-70ms behind).
  private _resizeEndTimer: ReturnType<typeof setTimeout> | null = null;
  private _isResizing = false;

  public setPageBounds(bounds: PageBounds) {
    // During active resize, the renderer's bounds are stale (from a previous
    // frame). Applying them would revert the bounds the resize handler just
    // set, causing visible flicker. Skip entirely — the resize handler is
    // the sole source of truth while resizing. After resizing stops, the
    // renderer's next update will reconcile insets and bounds.
    if (this._isResizing) return;

    this.pageBounds = bounds;

    // Recompute and cache insets from the renderer-reported bounds
    const [contentWidth, contentHeight] = this.browserWindow.getContentSize();
    this.pageInsets = {
      top: bounds.y,
      left: bounds.x,
      right: contentWidth - bounds.x - bounds.width,
      bottom: contentHeight - bounds.y - bounds.height
    };

    this.emit("page-bounds-changed", bounds);
    tabsController.handlePageBoundsChanged(this.id);
  }

  // Current Space //
  public currentSpaceId: string | null = null;

  setCurrentSpace(spaceId: string) {
    this.currentSpaceId = spaceId;
    this.emit("current-space-changed", spaceId);
    appMenuController.render();
    tabsController.setCurrentWindowSpace(this.id, spaceId);
  }

  // Override Destroy Method to Cleanup Window //
  public destroy(...args: Parameters<BaseWindowInstance["destroy"]>) {
    const result = super.destroy(...args);
    if (result) {
      // Destroy all tabs in the window
      // Do this so that it won't run if the app is closing
      // Technically after 500ms, the app is dead, so it won't run.
      setTimeout(() => {
        for (const tab of tabsController.getTabsInWindow(this.id)) {
          tab.destroy();
        }
      }, 500);

      this.omnibox.destroy();
      this.viewManager.destroy();
    }
    return result;
  }
}
