import { TabManager } from "@/browser/tabs";
import { PageBoundsWithWindow } from "@/ipc/browser/page";
import { cacheFavicon } from "@/modules/favicons";
import { FLAGS } from "@/modules/flags";
import { BrowserWindow, Session, WebContents, WebContentsView } from "electron";

// Interfaces and Types
interface PatchedWebContentsView extends WebContentsView {
  destroy: () => void;
}

enum TabMode {
  Standard = "standard",
  // TODO: Implement these modes in the future
  Glance = "glance",
  Split = "split"
}

type TabShowMode = TabMode;
type ActiveTabsMode = TabMode;

interface TabEvents {
  "tab-created": [Tab];
  "tab-destroyed": [Tab];
  "tab-selected": [Tab];
  "tab-deselected": [Tab];
  "tab-focused": [Tab];
  "tab-unfocused": [Tab];
  "tab-updated": [Tab];
  "page-bounds-changed": [PageBoundsWithWindow];
}

interface TabOptions {
  parentWindow: BrowserWindow;
  spaceId: string;
  webContentsViewOptions?: Electron.WebContentsViewConstructorOptions;
}

interface TabActiveData {
  mode: ActiveTabsMode;
  tabs: Array<{
    tabId: number;
    show: TabShowMode;
  }>;
}

// Tab Class
export class Tab {
  // Public properties
  readonly id: number;
  windowId: number;
  spaceId: string;

  // State properties
  active: boolean = false;
  focused: boolean = false;
  audible: boolean = false;
  isDestroyed: boolean = false;

  // View & content objects
  public readonly view: WebContentsView;
  public readonly webContents: WebContents;

  // Private properties
  private session: Session;
  private window: BrowserWindow;
  private boundsListener: (() => void) | null = null;
  private tabManager: TabManager;

  /**
   * Creates a new tab instance
   */
  constructor(options: TabOptions, tabManager: TabManager) {
    const { parentWindow, spaceId, webContentsViewOptions = {} } = options;
    const session = parentWindow.webContents.session;

    this.session = session;
    this.tabManager = tabManager;
    this.window = parentWindow;
    this.windowId = parentWindow.id;
    this.spaceId = spaceId;

    // Create view with proper session binding
    this.view = this.createWebContentsView(webContentsViewOptions, session);
    this.webContents = this.view.webContents;
    this.id = this.webContents.id;

    this.setupEventListeners();
    this.addToWindow(parentWindow);
  }

  /**
   * Creates a WebContentsView with appropriate session configuration
   */
  private createWebContentsView(
    options: Electron.WebContentsViewConstructorOptions,
    session: Session
  ): WebContentsView {
    const webPreferences = {
      ...(options.webPreferences || {}),
      session
    };

    if (options.webContents) {
      return new WebContentsView({
        webContents: options.webContents,
        webPreferences
      });
    }

    return new WebContentsView({ webPreferences });
  }

  /**
   * Sets up event listeners for tab events
   */
  private setupEventListeners(): void {
    // Handle favicon updates
    this.webContents.on("page-favicon-updated", (_event, favicons) => {
      const faviconURL = favicons[0];
      const url = this.webContents.getURL();
      if (faviconURL && url) {
        cacheFavicon(url, faviconURL);
      }
    });

    // Handle page load errors
    this.webContents.on("did-fail-load", (event, errorCode, _errorDescription, validatedURL, isMainFrame) => {
      event.preventDefault();

      // Skip aborted operations (user navigation cancellations)
      if (isMainFrame && errorCode !== -3) {
        this.loadErrorPage(errorCode, validatedURL);
      }
    });

    // Handle audio state changes
    this.webContents.on("audio-state-changed", (event) => {
      if (this.audible !== event.audible) {
        this.audible = event.audible;
        this.tabManager.emit("tab-updated", this);
      }
    });
  }

  /**
   * Loads an error page when navigation fails
   */
  private loadErrorPage(errorCode: number, validatedURL: string): void {
    const errorPageURL = new URL("flow-utility://page/error");
    errorPageURL.searchParams.set("errorCode", errorCode.toString());
    errorPageURL.searchParams.set("url", validatedURL);
    errorPageURL.searchParams.set("initial", "1");

    try {
      if (FLAGS.ERROR_PAGE_LOAD_MODE === "replace" && this.webContents) {
        this.webContents.executeJavaScript(`window.location.replace("${errorPageURL.toString()}")`);
      } else if (this.webContents) {
        this.webContents.loadURL(errorPageURL.toString());
      }
    } catch (error) {
      console.error("Failed to load error page:", error);
    }
  }

  /**
   * Adds the tab view to a window
   */
  private addToWindow(window: BrowserWindow): void {
    if (!window || !window.contentView) {
      throw new Error("Invalid window or content view");
    }
    window.contentView.addChildView(this.view, 1);

    if (this.active) {
      this.updateLayout();
    }
  }

  /**
   * Changes the parent window of this tab
   */
  setWindow(window: BrowserWindow): void {
    if (this.isDestroyed) return;
    if (!window || !window.contentView) {
      throw new Error("Invalid window or content view");
    }

    if (this.window && this.window.contentView) {
      this.window.contentView.removeChildView(this.view);
    }

    this.window = window;
    this.windowId = window.id;

    this.addToWindow(window);
  }

  /**
   * Loads a URL in the tab
   */
  loadURL(url: string): Promise<void> {
    if (this.isDestroyed || !this.view || !this.webContents) {
      return Promise.reject(new Error("Tab is not loaded or has been destroyed"));
    }
    return this.webContents.loadURL(url);
  }

  /**
   * Makes the tab visible
   */
  show(mode: TabShowMode = TabMode.Standard): void {
    if (this.isDestroyed) return;

    this.active = true;

    switch (mode) {
      case TabMode.Standard:
        this.view.setVisible(true);
        break;
      case TabMode.Glance:
      case TabMode.Split:
        // TODO: Implement Glance and Split modes
        this.view.setVisible(true);
        break;
    }
  }

  /**
   * Hides the tab
   */
  hide(): void {
    if (this.isDestroyed) return;

    this.active = false;
    this.view.setVisible(false);
  }

  /**
   * Updates the tab layout based on its mode
   */
  updateLayout(): void {
    if (this.isDestroyed) return;

    const bounds = this.tabManager.getPageBounds(this.windowId);
    if (bounds) {
      this.view.setBounds(bounds);
    }

    switch (this.tabManager.activeTabsMode) {
      case TabMode.Standard:
        this.view.setBorderRadius(8);
        break;
      case TabMode.Glance:
      case TabMode.Split:
        // TODO: Implement Glance and Split layout adjustments
        this.view.setBorderRadius(8);
        break;
    }
  }

  /**
   * Starts listening for window size/position changes
   */
  startBoundsListener(): void {
    if (this.isDestroyed) return;

    this.stopBoundsListener();

    if (!this.window) return;

    // Bind updateLayout to this instance
    const boundUpdateLayout = this.updateLayout.bind(this);
    this.window.on("resize", boundUpdateLayout);

    // Handle bounds changes
    this.boundsListener = () => {
      if (this.window) {
        this.updateLayout();
      }
    };
  }

  /**
   * Stops listening for window size/position changes
   */
  stopBoundsListener(): void {
    if (this.isDestroyed || !this.window) return;

    const boundUpdateLayout = this.updateLayout.bind(this);
    this.window.off("resize", boundUpdateLayout);

    if (this.boundsListener) {
      this.boundsListener = null;
    }
  }

  /**
   * Destroys the tab and cleans up resources
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.stopBoundsListener();
    this.tabManager.emit("tab-destroyed", this);

    if (this.window && this.window.contentView) {
      try {
        this.window.contentView.removeChildView(this.view);
      } catch (error) {
        console.error("Error removing child view:", error);
      }
    }

    try {
      (this.view as PatchedWebContentsView).destroy();
    } catch (error) {
      console.error("Error destroying web contents view:", error);
    }
  }
}
