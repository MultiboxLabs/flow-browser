import { Browser } from "@/browser/browser";
import { PageBounds } from "@/ipc/browser/page";
import { FLAGS } from "@/modules/flags";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getLastUsedSpace, SpaceData } from "@/sessions/spaces";
import { BrowserWindow, nativeTheme } from "electron";

type BrowserWindowType = "normal" | "popup";

type BrowserWindowCreationOptions = {
  window?: Electron.BrowserWindowConstructorOptions;
};

type BrowserWindowEvents = {
  "page-bounds-changed": [PageBounds];
  "current-space-changed": [string];
  destroy: [];
};

export class TabbedBrowserWindow extends TypedEventEmitter<BrowserWindowEvents> {
  id: number;
  window: BrowserWindow;
  private browser: Browser;
  private readonly type: BrowserWindowType;
  private pageBounds: PageBounds;
  private currentSpaceId: string | null = null;

  private isDestroyed: boolean = false;

  constructor(browser: Browser, type: BrowserWindowType, options: BrowserWindowCreationOptions = {}) {
    super();

    this.window = new BrowserWindow({
      minWidth: 800,
      minHeight: 400,
      width: 1280,
      height: 720,
      titleBarStyle: "hidden",
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
      frame: false,
      transparent: false,
      resizable: true,
      backgroundColor: "#00000000",
      visualEffectState: "followWindow",
      vibrancy: "fullscreen-ui", // on MacOS
      // backgroundMaterial: "mica", // on Windows (Disabled as it interferes with rounded corners)
      roundedCorners: true,
      ...(options.window || {})
    });

    this.window.loadURL("flow-internal://page/main/");

    if (FLAGS.SHOW_DEBUG_DEVTOOLS) {
      setTimeout(() => {
        this.window.webContents.openDevTools({
          mode: "detach"
        });
      }, 0);
    }

    this.id = this.window.id;
    this.type = type;

    this.browser = browser;

    this.pageBounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };

    if (type === "normal") {
      // Show normal UI
    } else if (type === "popup") {
      // TODO: Show popup UI
    }

    getLastUsedSpace().then((space) => {
      this.setCurrentSpace(space.id);
    });
  }

  setCurrentSpace(spaceId: string) {
    this.currentSpaceId = spaceId;
    this.emit("current-space-changed", spaceId);

    for (const profile of this.browser.getLoadedProfiles()) {
      profile.tabs.setCurrentWindowSpace(this.id, spaceId);
    }
  }

  destroy() {
    if (this.isDestroyed) {
      throw new Error("Window already destroyed!");
    }

    // Destroy the window
    this.isDestroyed = true;
    this.emit("destroy");
    this.browser.destroyWindowById(this.id);

    // Destroy emitter
    this.destroyEmitter();
  }

  setPageBounds(bounds: PageBounds) {
    this.pageBounds = bounds;
    this.emit("page-bounds-changed", bounds);

    for (const profile of this.browser.getLoadedProfiles()) {
      profile.tabs.handlePageBoundsChanged(this.id);
    }
  }

  getPageBounds() {
    return this.pageBounds;
  }
}
