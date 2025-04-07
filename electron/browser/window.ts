import { Browser } from "@/browser/browser";
import { LoadedProfile } from "@/browser/profile-manager";
import { TabManager } from "@/browser/tabs";
import { FLAGS } from "@/modules/flags";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getSpace, getSpaceFromProfile, SpaceData } from "@/sessions/spaces";
import { BrowserWindow, nativeTheme, WebContentsViewConstructorOptions } from "electron";

type BrowserWindowType = "normal" | "popup";

type BrowserWindowCreationOptions = {
  window?: Electron.BrowserWindowConstructorOptions;
};

type BrowserWindowEvents = {
  destroy: [];
};

type LoadedSpace = {
  spaceId: string;
  spaceData: SpaceData;
  tabs: TabManager;
  loadedProfile: LoadedProfile;
  unload: () => void;
};

export class TabbedBrowserWindow extends TypedEventEmitter<BrowserWindowEvents> {
  id: number;
  window: BrowserWindow;
  private browser: Browser;
  private readonly type: BrowserWindowType;
  private loadedSpaces: Map<string, LoadedSpace>;

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

    this.loadedSpaces = new Map();
    this.browser = browser;

    if (type === "normal") {
      // Show normal UI
    } else if (type === "popup") {
      // TODO: Show popup UI
    }
  }

  destroy() {
    if (this.isDestroyed) {
      throw new Error("Window already destroyed!");
    }

    // Destroy all spaces
    for (const space of this.loadedSpaces.values()) {
      space.unload();
    }

    // Destroy the window
    this.isDestroyed = true;
    this.emit("destroy");
    this.browser.destroyWindowById(this.id);

    // Destroy emitter
    this.destroyEmitter();
  }
}
