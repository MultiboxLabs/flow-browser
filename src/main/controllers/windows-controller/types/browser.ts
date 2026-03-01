import { BaseWindow, BaseWindowEvents } from "@/controllers/windows-controller/types/base";
import { BrowserWindow as ElectronBrowserWindow, nativeTheme, WebContents } from "electron";
import { type PageBounds } from "@/ipc/browser/page";
import { type PageLayoutParams } from "~/flow/types";
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
import { quitController } from "@/controllers/quit-controller";
import { hex_is_light } from "@/modules/utils";
import { ViewLayer } from "~/layers";
import {
  SidebarInterpolation,
  SIDEBAR_ANIMATE_DURATION
} from "@/controllers/windows-controller/utils/browser/sidebar-interpolation";

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
  "enter-full-screen": [];
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
      minWidth: type === "normal" ? 800 : 300,
      minHeight: type === "normal" ? 400 : 200,

      width: options.width ?? 1280,
      height: options.height ?? 720,

      x: options.x,
      y: options.y,
      center: hasPositionOptions ? false : true,

      titleBarStyle: process.platform === "darwin" || process.platform === "win32" ? "hidden" : undefined,
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
      vibrancy: "popover", // on MacOS
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
      // browserWindow.webContents.openDevTools({ mode: "detach" });
    });

    super("browser", browserWindow, { showAfterLoad: true, showDelay: 50 });

    this.browserWindowType = type;

    browserWindow.on("enter-full-screen", () => {
      // Fullscreen fundamentally changes the UI layout (chrome is hidden).
      // Recompute page bounds immediately — the renderer will also send
      // updated layout params, but this eliminates the timing gap.
      this.recomputePageBounds();

      this.emit("enter-full-screen");
      this._updateMacOSTrafficLights();
      fireWindowStateChanged(this);
    });

    // "leave-full-screen" event
    browserWindow.on("leave-full-screen", () => {
      // Same as enter-full-screen: recompute bounds immediately.
      this.recomputePageBounds();

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

    // Recompute page bounds on resize — with declarative layout params,
    // the main process can compute bounds directly from getContentSize()
    // without waiting for the renderer round-trip.
    browserWindow.on("resize", () => {
      this.recomputePageBounds();
    });

    // View Manager //
    this.viewManager = new ViewManager(browserWindow.contentView);
    this.coreWebContents = [browserWindow.webContents];

    // Omnibox //
    this.omnibox = new Omnibox(browserWindow);
    this.viewManager.addOrUpdateView(this.omnibox.view, ViewLayer.OMNIBOX);
    this.coreWebContents.push(this.omnibox.webContents);

    // Current Space //
    spacesController.getLastUsed().then((space) => {
      if (space && !this.currentSpaceId) {
        this.setCurrentSpace(space.id);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const window = this;
    function onSpaceChanged() {
      const spaceId = window.currentSpaceId;
      if (!spaceId) return;
      spacesController.get(spaceId).then((space) => {
        if (!space) return;

        // win32 and linux only
        if (process.platform === "darwin") return;

        browserWindow.setTitleBarOverlay({
          height: 30,
          symbolColor: hex_is_light(space.bgStartColor || "#ffffff") ? "black" : "white",
          color: "rgba(0,0,0,0)"
        });
      });
    }
    onSpaceChanged();
    this.on("current-space-changed", onSpaceChanged);

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

  // Declarative Page Bounds (Used for Tabs) //
  // See design/DECLARATIVE_PAGE_BOUNDS.md for the full design.
  public pageBounds: PageBounds = { x: 0, y: 0, width: 0, height: 0 };

  /** Layout parameters received from the renderer. */
  private layoutParams: PageLayoutParams | null = null;

  /** Active sidebar open/close interpolation, or null when static. */
  private sidebarInterpolation: SidebarInterpolation | null = null;

  /**
   * Accepts declarative layout parameters from the renderer and computes
   * page bounds. When `sidebarAnimating` is true, starts an ease-in-out
   * interpolation of the sidebar width that mirrors the CSS transition.
   */
  public setLayoutParams(params: PageLayoutParams, sentAt?: number): void {
    const prevParams = this.layoutParams;
    this.layoutParams = params;

    // Compute IPC transit delay so the interpolation can be backdated
    // to match the CSS transition start time in the renderer.
    const advanceMs = sentAt ? Math.max(0, Date.now() - sentAt) : 0;

    // Compute the target effective sidebar width from the new params.
    const targetWidth = params.sidebarVisible ? params.sidebarWidth : 0;

    if (params.sidebarAnimating) {
      // Determine starting width for the interpolation.
      // Prefer the current interpolation value (handles rapid toggle / mid-animation
      // re-trigger gracefully), otherwise derive from previous params.
      let fromWidth: number;
      if (this.sidebarInterpolation) {
        fromWidth = this.sidebarInterpolation.currentValue;
        this.sidebarInterpolation.stop();
      } else if (prevParams) {
        fromWidth = prevParams.sidebarVisible ? prevParams.sidebarWidth : 0;
      } else {
        // No previous state (first params ever) — no animation possible.
        fromWidth = targetWidth;
      }

      if (fromWidth !== targetWidth) {
        this.sidebarInterpolation = new SidebarInterpolation(
          fromWidth,
          targetWidth,
          SIDEBAR_ANIMATE_DURATION,
          () => {
            this.recomputePageBounds();
          },
          () => {
            // Animation complete
            this.sidebarInterpolation = null;
            this.recomputePageBounds();
          }
        );
        this.sidebarInterpolation.start(advanceMs);
      } else {
        // from === to: nothing to animate (e.g. duplicate message)
        this.sidebarInterpolation = null;
        this.recomputePageBounds();
      }
    } else {
      // Not animating — apply immediately
      if (this.sidebarInterpolation) {
        this.sidebarInterpolation.stop();
        this.sidebarInterpolation = null;
      }
      this.recomputePageBounds();
    }
  }

  /**
   * Legacy path: accepts pre-computed bounds from the renderer.
   * Used by the old browser UI which has a different layout structure.
   */
  public setPageBounds(bounds: PageBounds) {
    this.pageBounds = bounds;
    this.emit("page-bounds-changed", bounds);
    tabsController.handlePageBoundsChanged(this.id);
  }

  /**
   * Computes page bounds from declarative layout parameters and the
   * window's content size. This is the single source of truth for
   * page bounds when using the new declarative system.
   */
  private recomputePageBounds(): void {
    if (!this.layoutParams) return;
    if (this.destroyed || this.browserWindow.isDestroyed()) return;

    const [cw, ch] = this.browserWindow.getContentSize();
    const { topbarHeight, topbarVisible, sidebarWidth, sidebarSide, sidebarVisible, contentTopOffset } =
      this.layoutParams;

    // Effective sidebar width (animated or static)
    let effectiveSidebarWidth: number;
    if (this.sidebarInterpolation) {
      // During animation, subtract a small buffer so the WebContentsView
      // extends slightly under the sidebar. This hides any residual desync
      // from IPC delay, setTimeout jitter, and compositor frame misalignment.
      // The buffer tapers to 0 near the target to avoid a visible snap when
      // the animation completes. The sidebar's opaque background covers the
      // overlap, so the user never sees the webcontents underneath.
      const ANIM_BUFFER = 15;
      const targetWidth = sidebarVisible ? sidebarWidth : 0;
      const remaining = Math.abs(this.sidebarInterpolation.currentValue - targetWidth);
      const buffer = Math.min(ANIM_BUFFER, remaining);
      effectiveSidebarWidth = Math.max(0, this.sidebarInterpolation.currentValue - buffer);
    } else {
      effectiveSidebarWidth = sidebarVisible ? sidebarWidth : 0;
    }

    const PADDING = 12;
    const padTop = (topbarVisible ? topbarHeight : PADDING) + (contentTopOffset ?? 0);
    const padBottom = PADDING;

    const x = (sidebarSide === "left" ? effectiveSidebarWidth : 0) + PADDING;
    const y = padTop;
    const width = Math.max(0, cw - effectiveSidebarWidth - PADDING * 2);
    const height = Math.max(0, ch - padTop - padBottom);

    const newBounds: PageBounds = { x, y, width, height };
    this.pageBounds = newBounds;
    this.emit("page-bounds-changed", newBounds);
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
    // Stop any in-flight sidebar interpolation to prevent timer callbacks
    // from firing after the window is destroyed (getContentSize() would throw).
    if (this.sidebarInterpolation) {
      this.sidebarInterpolation.stop();
      this.sidebarInterpolation = null;
    }

    const result = super.destroy(...args);
    if (result) {
      // Destroy all tabs in the window after a delay.
      // Skip during quit — the process is dying and the database is already closed,
      // so calling tab.destroy() would crash when it tries to access SQLite.
      if (!quitController.isQuitting) {
        setTimeout(() => {
          for (const tab of tabsController.getTabsInWindow(this.id)) {
            tab.destroy();
          }
        }, 500);
      }

      this.omnibox.destroy();
      this.viewManager.destroy();
    }
    return result;
  }
}
