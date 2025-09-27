import { defaultSessionReady } from "@/browser/sessions";
import { BaseWindow, BaseWindowEvents } from "@/controllers/windows-controller/types/base";
import { BrowserWindow as ElectronBrowserWindow, nativeTheme } from "electron";
import { type PageBounds } from "@/ipc/browser/page";
import { appMenuController } from "@/controllers/app-menu-controller";

export type BrowserWindowType = "normal" | "popup";

interface BrowserWindowEvents extends BaseWindowEvents {
  "page-bounds-changed": [bounds: PageBounds];
  "current-space-changed": [spaceId: string];
}

export class BrowserWindow extends BaseWindow<BrowserWindowEvents> {
  private browserWindowType: BrowserWindowType;

  constructor(type: BrowserWindowType) {
    const browserWindow = new ElectronBrowserWindow({
      minWidth: type === "normal" ? 800 : 250,
      minHeight: type === "normal" ? 400 : 200,

      width: 1280,
      height: 720,

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
    defaultSessionReady.then(() => {
      // Load the correct UI
      if (type === "normal") {
        browserWindow.loadURL("flow-internal://main-ui/");
      } else if (type === "popup") {
        browserWindow.loadURL("flow-internal://popup-ui/");
      }
    });

    super("browser", browserWindow, { showAfterLoad: true });

    this.browserWindowType = type;
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

  public setPageBounds(bounds: PageBounds) {
    this.pageBounds = bounds;
    this.emit("page-bounds-changed", bounds);

    // TODO: connect to tab manager
    // this.browser.tabs.handlePageBoundsChanged(this.id);
  }

  // Current Space //
  public currentSpaceId: string | null = null;

  setCurrentSpace(spaceId: string) {
    this.currentSpaceId = spaceId;
    this.emit("current-space-changed", spaceId);
    appMenuController.render();

    // TODO: connect to tab manager
    // this.browser.tabs.setCurrentWindowSpace(this.id, spaceId);
  }
}
