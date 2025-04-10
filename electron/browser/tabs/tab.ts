import { Browser } from "@/browser/browser";
import { isRectangleEqual, TabBoundsController } from "@/browser/tabs/tab-bounds";
import { TabGroupMode } from "@/browser/tabs/tab-groups";
import { GlanceTabGroup } from "@/browser/tabs/tab-groups/glance";
import { TabManager } from "@/browser/tabs/tab-manager";
import { TabbedBrowserWindow } from "@/browser/window";
import { cacheFavicon } from "@/modules/favicons";
import { FLAGS } from "@/modules/flags";
import { PATHS } from "@/modules/paths";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { Rectangle, Session, WebContents, WebContentsView, WebPreferences } from "electron";

// Configuration
const GLANCE_FRONT_ZINDEX = 3;
const TAB_ZINDEX = 2;
const GLANCE_BACK_ZINDEX = 0;

// Interfaces and Types
interface PatchedWebContentsView extends WebContentsView {
  destroy: () => void;
}

type TabEvents = {
  "space-changed": [];
  "window-changed": [];
  focused: [];
  updated: [];
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
}

function createWebContentsView(
  session: Session,
  options: Electron.WebContentsViewConstructorOptions
): PatchedWebContentsView {
  const webContents = options.webContents;
  const webPreferences: WebPreferences = {
    sandbox: true,
    session: session,
    scrollBounce: true,
    safeDialogs: true,
    navigateOnDragDrop: true,

    // Provide access to 'flow' globals
    preload: PATHS.PRELOAD,

    // Merge with any additional preferences
    ...(options.webPreferences || {})
  };

  const webContentsView = new WebContentsView({
    webPreferences,
    // Only add webContents if it is provided
    ...(webContents ? { webContents } : {})
  });

  webContentsView.setVisible(false);

  return webContentsView as PatchedWebContentsView;
}

function setupEventListeners(tab: Tab) {
  const { webContents } = tab;

  // Used by the tab manager to determine which tab is focused
  webContents.on("focus", () => {
    tab.emit("focused");
  });

  // Handle favicon updates
  webContents.on("page-favicon-updated", (_event, favicons) => {
    const faviconURL = favicons[0];
    const url = tab.webContents.getURL();
    if (faviconURL && url) {
      cacheFavicon(url, faviconURL);
    }
    if (faviconURL && faviconURL !== tab.faviconURL) {
      tab.faviconURL = faviconURL;
      tab.emit("updated");
    }
  });

  // Handle page load errors
  webContents.on("did-fail-load", (event, errorCode, _errorDescription, validatedURL, isMainFrame) => {
    event.preventDefault();

    // Skip aborted operations (user navigation cancellations)
    if (isMainFrame && errorCode !== -3) {
      tab.loadErrorPage(errorCode, validatedURL);
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
      tab.updateTabState();
    });
  }
}

// Tab Class
export class Tab extends TypedEventEmitter<TabEvents> {
  // Public properties
  public readonly id: number;
  public readonly profileId: string;
  public spaceId: string;

  // State properties
  public visible: boolean = false;
  public isDestroyed: boolean = false;
  public faviconURL: string | null = null;

  // Content properties
  public title: string = "";
  public url: string = "";
  public isLoading: boolean = false;
  public audible: boolean = false;
  public muted: boolean = false;

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
    const { window, webContentsViewOptions = {} } = options;

    // Create WebContentsView
    const webContentsView = createWebContentsView(session, webContentsViewOptions);
    const webContents = webContentsView.webContents;
    this.id = webContents.id;
    this.view = webContentsView;
    this.webContents = webContents;

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
              let windowId = this.window.id;

              const isNewWindow = details.disposition === "new-window";
              const isForegroundTab = details.disposition === "foreground-tab";
              const isBackgroundTab = details.disposition === "background-tab";

              if (isNewWindow) {
                // TODO: popup window instead of standard window
                const newWindow = this.browser.createWindowInternal("normal");
                windowId = newWindow.id;
              }

              const newTab = this.tabManager.internalCreateTab(
                this.profileId,
                windowId,
                this.spaceId,
                constructorOptions
              );
              newTab.loadURL(details.url);

              let glanced = false;

              // Glance if possible
              if (isForegroundTab) {
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
          };
        }
        default:
          return { action: "allow" };
      }
    });

    // Setup event listeners
    setupEventListeners(this);
  }

  public updateTabState() {
    const { webContents } = this;

    // Generate state objects
    const oldState = {
      title: this.title,
      url: this.url,
      isLoading: this.isLoading,
      audible: this.audible,
      muted: this.muted
    };
    const newState = {
      title: webContents.getTitle(),
      url: webContents.getURL(),
      isLoading: webContents.isLoading(),
      audible: webContents.isAudioMuted(),
      muted: webContents.isAudioMuted()
    };

    // Compare states
    const keys = [...Object.keys(oldState), ...Object.keys(newState)];

    let changed = false;
    for (const key of keys) {
      // @ts-expect-error: whatever
      if (oldState[key] !== newState[key]) {
        changed = true;
        // @ts-expect-error: whatever again
        this[key] = newState[key];
        break;
      }
    }

    if (changed) {
      this.emit("updated");
      return true;
    }
    return false;
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
      const sanitizedUrl = url.replace(/`/g, "\\`").replace(/"/g, '\\"');
      this.webContents.executeJavaScript(`window.location.replace("${sanitizedUrl}")`);
    } else {
      this.webContents.loadURL(url);
    }
  }

  /**
   * Loads an error page in the tab
   */
  public loadErrorPage(errorCode: number, url: string) {
    const errorPageURL = new URL("flow-utility://page/error");
    errorPageURL.searchParams.set("errorCode", errorCode.toString());
    errorPageURL.searchParams.set("url", url);
    errorPageURL.searchParams.set("initial", "1");

    const replace = FLAGS.ERROR_PAGE_LOAD_MODE === "replace";
    this.loadURL(errorPageURL.toString(), replace);
  }

  /**
   * Updates the layout of the tab
   */
  public updateLayout() {
    const { visible, window, tabManager } = this;

    // Update visibility
    if (this.view.getVisible() !== visible) {
      this.view.setVisible(visible);
    }

    if (!visible) return;

    // Update bounds
    const bounds = window.getPageBounds();
    this.view.setBorderRadius(8);

    // Update layout
    const tabGroup = tabManager.getTabGroupByTabId(this.id);

    const lastTabGroupMode = this.lastTabGroupMode;
    let newBounds: Rectangle | null = null;
    let newTabGroupMode: TabGroupMode | null = null;

    let isGlanceFront = false;

    if (!tabGroup) {
      newTabGroupMode = "normal";
      newBounds = bounds;
    } else if (tabGroup.mode === "glance") {
      const isFront = tabGroup.frontTabId === this.id;
      const widthPercentage = isFront ? 0.85 : 0.95;
      const heightPercentage = isFront ? 1 : 0.975;

      const newWidth = Math.floor(bounds.width * widthPercentage);
      const newHeight = Math.floor(bounds.height * heightPercentage);

      // Calculate new x and y to maintain center position
      const xOffset = Math.floor((bounds.width - newWidth) / 2);
      const yOffset = Math.floor((bounds.height - newHeight) / 2);

      const glanceBounds = {
        x: bounds.x + xOffset,
        y: bounds.y + yOffset,
        width: newWidth,
        height: newHeight
      };

      if (isFront) {
        isGlanceFront = true;

        this.bounds.setBounds({
          x: glanceBounds.x + (glanceBounds.width - 100) / 2,
          y: glanceBounds.y + (glanceBounds.height - 100) / 2,
          width: 100,
          height: 100
        });
      } else {
        this.window.glanceModal.setBounds(glanceBounds);
      }

      newTabGroupMode = "glance";
      newBounds = glanceBounds;
    } else if (tabGroup.mode === "split") {
      /* TODO: Implement split tab group layout
      const tab = tabGroup.tabs.find((tab) => tab.id === this.id);

      if (tab) {
        const { x: xPercentage, y: yPercentage, width: widthPercentage, height: heightPercentage } = tab;

        const xOffset = Math.floor(bounds.width * xPercentage);
        const yOffset = Math.floor(bounds.height * yPercentage);
        const newWidth = Math.floor(bounds.width * widthPercentage);
        const newHeight = Math.floor(bounds.height * heightPercentage);

        const newBounds = {
          x: bounds.x + xOffset,
          y: bounds.y + yOffset,
          width: newWidth,
          height: newHeight
        };

        newTabGroupMode = "split";
        newBounds = newBounds;
      }
      */
    }

    if (newTabGroupMode === "glance") {
      if (isGlanceFront) {
        this.setWindow(this.window, GLANCE_FRONT_ZINDEX);
      } else {
        this.setWindow(this.window, GLANCE_BACK_ZINDEX);
      }
    } else {
      this.setWindow(this.window, TAB_ZINDEX);
    }

    if (isGlanceFront) {
      this.view.setBackgroundColor("#ffffffff");
    } else {
      this.view.setBackgroundColor("#00000000");
    }

    if (newTabGroupMode !== lastTabGroupMode) {
      this.lastTabGroupMode = newTabGroupMode;
    }

    if (newTabGroupMode === "glance" && newBounds) {
      this.window.glanceModal.setVisible(true);
    } else {
      this.window.glanceModal.setVisible(false);
    }

    if (newBounds) {
      if (newTabGroupMode !== lastTabGroupMode) {
        this.bounds.setBounds(newBounds);
      } else {
        if (isRectangleEqual(this.bounds.bounds, this.bounds.targetBounds)) {
          this.bounds.setBoundsImmediate(newBounds);
        } else {
          this.bounds.setBounds(newBounds);
        }
      }
    }
  }

  /**
   * Shows the tab
   */
  public show() {
    if (this.visible) return;
    this.visible = true;
    this.emit("updated");
    this.updateLayout();
  }

  /**
   * Hides the tab
   */
  public hide() {
    if (!this.visible) return;
    this.visible = false;
    this.emit("updated");
    this.updateLayout();
  }

  /**
   * Destroys the tab and cleans up resources
   */
  public destroy() {
    if (this.isDestroyed) return;

    this.bounds.destroy();
    this.removeViewFromWindow();
    this.webContents.close();

    this.isDestroyed = true;
    this.emit("destroyed");

    this.destroyEmitter();
  }
}
