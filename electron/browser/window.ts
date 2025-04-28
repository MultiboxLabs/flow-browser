import { Browser } from "@/browser/browser";
import { Omnibox } from "@/browser/components/omnibox";
import { ViewManager } from "@/browser/view-manager";
import { PageBounds } from "@/ipc/browser/page";
import { FLAGS } from "@/modules/flags";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getLastUsedSpace } from "@/sessions/spaces";
import { BrowserWindow, nativeTheme, WebContents } from "electron";
import "./close-preventer";
import { WindowEventType } from "@/modules/windows";
import { windowEvents } from "@/modules/windows";
import { initializePortalComponentWindows } from "@/browser/components/portal-component-windows";

type BrowserWindowType = "normal" | "popup";

type BrowserWindowCreationOptions = {
  window?: Electron.BrowserWindowConstructorOptions;
};

type BrowserWindowEvents = {
  "page-bounds-changed": [PageBounds];
  "current-space-changed": [string];
  "enter-full-screen": [];
  "leave-full-screen": [];
  destroy: [];
};

export class TabbedBrowserWindow extends TypedEventEmitter<BrowserWindowEvents> {
  id: number;
  window: BrowserWindow;
  public viewManager: ViewManager;
  public coreWebContents: WebContents[];

  public omnibox: Omnibox;

  private browser: Browser;
  public readonly type: BrowserWindowType;
  private pageBounds: PageBounds;
  private currentSpaceId: string | null = null;

  private isDestroyed: boolean = false;

  constructor(browser: Browser, type: BrowserWindowType, options: BrowserWindowCreationOptions = {}) {
    super();

    this.window = new BrowserWindow({
      minWidth: type === "normal" ? 800 : 250,
      minHeight: type === "normal" ? 400 : 200,
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
      title: "Flow",
      frame: false,
      transparent: false,
      resizable: true,
      backgroundColor: process.platform === "darwin" ? "#00000000" : "#000000",
      visualEffectState: "followWindow",
      vibrancy: "fullscreen-ui", // on MacOS
      backgroundMaterial: "none", // on Windows (Disabled as it interferes with rounded corners)
      roundedCorners: true,
      ...(options.window || {}),

      // Show after ready
      show: false
    });

    // Hide the window buttons before the component is mounted
    this.window.setWindowButtonVisibility(false);

    const windowOptions = options.window || {};
    const hasSizeOptions = "width" in windowOptions || "height" in windowOptions;
    const hasPositionOptions = "x" in windowOptions || "y" in windowOptions;

    if (!hasSizeOptions && !hasPositionOptions) {
      this.window.maximize();
    }

    this.window.on("enter-full-screen", () => {
      this.emit("enter-full-screen");
    });

    this.window.on("leave-full-screen", () => {
      this.emit("leave-full-screen");
    });

    // Focus on the focused tab
    // Electron does not do this automatically, so we are forced to do it manually.
    this.window.on("focus", () => {
      // Try focusing the omnibox first
      const focusedOmnibox = this.omnibox.refocus();
      if (focusedOmnibox) {
        return;
      }

      // If omnibox cannot be focused, focus the focused tab
      const tabManager = this.browser.tabs;
      const currentSpace = this.getCurrentSpace();
      if (!currentSpace) return;

      const focusedTab = tabManager.getFocusedTab(this.id, currentSpace);
      if (!focusedTab) return;

      const tabWC = focusedTab.webContents;
      if (!tabWC.isFocused()) {
        tabWC.focus();
      }
    });

    this.window.once("ready-to-show", () => {
      this.window.show();
      this.window.focus();
    });

    this.window.on("focus", () => {
      windowEvents.emit(WindowEventType.FOCUSED, this.window);
    });

    this.window.once("closed", () => {
      this.destroy();
    });

    // If the window is a popup, destroy the window when there are no tabs left
    if (type === "popup") {
      browser.tabs.on("tab-removed", () => {
        const windowTabs = browser.tabs.getTabsInWindow(this.id);
        if (windowTabs.length === 0) {
          this.destroy();
        }
      });
    }

    if (type === "normal") {
      // Show normal UI
      this.window.loadURL("flow-internal://main-ui/");
    } else if (type === "popup") {
      // TODO: Show popup UI
      this.window.loadURL("flow-internal://popup-ui/");
    }

    if (FLAGS.SHOW_DEBUG_DEVTOOLS) {
      setTimeout(() => {
        this.window.webContents.openDevTools({
          mode: "detach"
        });
      }, 0);
    }

    this.id = this.window.id;
    this.type = type;

    this.coreWebContents = [this.window.webContents];

    this.viewManager = new ViewManager(this.window.contentView);

    this.omnibox = new Omnibox(this.window);
    this.viewManager.addOrUpdateView(this.omnibox.view, 999);
    this.coreWebContents.push(this.omnibox.webContents);

    this.browser = browser;

    this.pageBounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };

    getLastUsedSpace().then((space) => {
      if (space) {
        this.setCurrentSpace(space.id);
      }
    });

    initializePortalComponentWindows(this);
  }

  setCurrentSpace(spaceId: string) {
    this.currentSpaceId = spaceId;
    this.emit("current-space-changed", spaceId);
    this.browser.updateMenu();

    this.browser.tabs.setCurrentWindowSpace(this.id, spaceId);
  }

  getCurrentSpace() {
    return this.currentSpaceId;
  }

  public sendMessageToCoreWebContents(channel: string, ...args: any[]) {
    for (const content of this.coreWebContents) {
      if (content.isDestroyed()) continue;
      content.send(channel, ...args);
    }
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }

    // Destroy all tabs in the window
    // Do this so that it won't run if the app is closing
    // Technically after 500ms, the app is dead, so it won't run.
    setTimeout(() => {
      for (const tab of this.browser.tabs.getTabsInWindow(this.id)) {
        tab.destroy();
      }
    }, 500);

    // Destroy the window
    this.isDestroyed = true;
    this.emit("destroy");
    this.browser.destroyWindowById(this.id);

    // WE CANNOT CALL REMOVECHILDVIEW AFTER DESTROY, OR IT WILL CRASH!!!!
    const windowDestroyed = this.window.isDestroyed();
    this.viewManager.destroy(windowDestroyed);

    this.omnibox.destroy();

    if (!windowDestroyed) {
      this.window.destroy();
    }

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
