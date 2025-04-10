import { Browser } from "@/browser/browser";
import { ViewManager } from "@/browser/view-manager";
import { PageBounds } from "@/ipc/browser/page";
import { FLAGS } from "@/modules/flags";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getLastUsedSpace, getSpace, SpaceData } from "@/sessions/spaces";
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
  public viewManager: ViewManager;

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
      ...(options.window || {}),

      // Show after ready
      show: false
    });

    this.window.once("ready-to-show", () => {
      this.window.show();
      this.window.focus();
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

    this.viewManager = new ViewManager(this.window.contentView);

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

    this.browser.tabs.setCurrentWindowSpace(this.id, spaceId);

    // Test Code
    if (this.browser.tabs.getTabsInWindowSpace(this.id, spaceId).length === 0) {
      getSpace(spaceId).then(async (space) => {
        if (space) {
          const profileId = space.profileId;
          const tab = await this.browser.tabs.createTab(profileId, this.id, spaceId);
          tab.loadURL("https://x.com/zaidmukaddam/status/1910342330579644739");
          this.browser.tabs.setActiveTab(tab);
        }
      });
    }
  }

  getCurrentSpace() {
    return this.currentSpaceId;
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

    this.browser.tabs.handlePageBoundsChanged(this.id);
  }

  getPageBounds() {
    return this.pageBounds;
  }
}
