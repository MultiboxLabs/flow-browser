import { Browser } from "@/browser/browser";
import { TabManager } from "@/browser/tabs";
import { TabbedBrowserWindow } from "@/browser/window";
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
  browser: Browser;
  tabManager: TabManager;
  window: TabbedBrowserWindow;
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
  private browser: Browser;
  private window: TabbedBrowserWindow;
  private tabManager: TabManager;

  /**
   * Creates a new tab instance
   */
  constructor(options: TabOptions) {
    const { browser, tabManager, window, spaceId, webContentsViewOptions = {} } = options;

    const rawWindow = window.window;
    const session = rawWindow.webContents.session;

    this.session = session;
    this.browser = browser;
    this.tabManager = tabManager;

    this.window = window;
    this.windowId = window.id;
    this.spaceId = spaceId;

    // Create view with proper session binding
    this.view = this.createWebContentsView(webContentsViewOptions, session);
    this.webContents = this.view.webContents;
    this.id = this.webContents.id;

    this.setupEventListeners();
    this.addToWindow(rawWindow);
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
   * Removes the tab from the current window
   */
  private removeFromCurrentWindow(): void {
    if (this.window && this.window.window.contentView) {
      this.window.window.contentView.removeChildView(this.view);
    }
  }

  /**
   * Changes the parent window of this tab
   */
  setWindow(window: TabbedBrowserWindow): void {
    if (this.isDestroyed) return;

    const currentRawWindow = this.window.window;
    const newRawWindow = window.window;

    if (!newRawWindow.contentView) {
      throw new Error("Invalid window or content view");
    }

    this.removeFromCurrentWindow();

    this.window = window;
    this.windowId = window.id;

    this.addToWindow(newRawWindow);
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

    const bounds = this.window.getPageBounds();
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
   * Destroys the tab and cleans up resources
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.tabManager.emit("tab-destroyed", this);

    this.removeFromCurrentWindow();

    try {
      (this.view as PatchedWebContentsView).destroy();
    } catch (error) {
      console.error("Error destroying web contents view:", error);
    }
  }
}
