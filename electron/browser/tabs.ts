import { EventEmitter } from "events";
import { WebContents, BrowserWindow, WebContentsView, ipcMain } from "electron";
import { FLAGS } from "../modules/flags";

type PageBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const windowsBounds = new Map<BrowserWindow, PageBounds>();
const windowsBoundsEmitter = new EventEmitter();

class Tab {
  id: number;
  destroyOnNoTabs: boolean;
  destroyed: boolean;

  window: BrowserWindow | undefined;
  webContents: WebContents | undefined;
  view: WebContentsView | undefined;
  boundsListener: (() => void) | null = null;

  constructor(
    parentWindow: BrowserWindow,
    webContentsViewOptions: Electron.WebContentsViewConstructorOptions = {},
    destroyOnNoTabs: boolean = false
  ) {
    this.invalidateLayout = this.invalidateLayout.bind(this);

    if (webContentsViewOptions.webContents) {
      // If webContents is provided, use it
      this.view = new WebContentsView({
        webContents: webContentsViewOptions.webContents,
        webPreferences: {
          ...(webContentsViewOptions.webPreferences || {})
        }
      });
    } else {
      // Otherwise create a new WebContentsView without specifying webContents
      this.view = new WebContentsView({
        webPreferences: {
          ...(webContentsViewOptions.webPreferences || {})
        }
      });
    }

    this.id = this.view.webContents.id;
    this.destroyOnNoTabs = destroyOnNoTabs;
    this.window = parentWindow;
    this.webContents = this.view.webContents;
    this.destroyed = false;

    this.webContents.on("did-fail-load", (event, errorCode, _errorDescription, validatedURL, isMainFrame) => {
      event.preventDefault();

      // ignore -3 (ABORTED) - An operation was aborted (due to user action).
      if (isMainFrame && errorCode !== -3) {
        const errorPageURL = new URL("flow-utility://page/error");
        errorPageURL.searchParams.set("errorCode", errorCode.toString());
        errorPageURL.searchParams.set("url", validatedURL);
        errorPageURL.searchParams.set("initial", "1");

        if (FLAGS.ERROR_PAGE_LOAD_MODE === "replace") {
          this.webContents.executeJavaScript(`window.location.replace("${errorPageURL.toString()}")`);
        } else {
          this.webContents.loadURL(errorPageURL.toString());
        }
      }
    });

    this.window.contentView.addChildView(this.view);
  }

  destroy() {
    if (this.destroyed) return;

    this.destroyed = true;

    this.hide();

    if (this.window) {
      if (this.window && !this.window.isDestroyed() && this.view) {
        this.window.contentView.removeChildView(this.view);
      }
      this.window = undefined;
    }

    if (this.webContents && !this.webContents.isDestroyed()) {
      if (this.webContents.isDevToolsOpened()) {
        this.webContents.closeDevTools();
      }

      // TODO: why is this no longer called?
      this.webContents.emit("destroyed");

      // Undocumented method
      (this.webContents as any).destroy();
    }

    this.webContents = undefined;
    this.view = undefined;
  }

  loadURL(url: string) {
    if (!this.view) {
      return Promise.reject(new Error("Tab is not loaded"));
    }
    return this.view.webContents.loadURL(url);
  }

  show() {
    this.invalidateLayout();
    this.startBoundsListener();
    if (this.view) {
      if (FLAGS.DEBUG_DISABLE_TAB_VIEW) {
        this.view.setVisible(false);
      } else {
        this.view.setVisible(true);
      }
    }
  }

  hide() {
    this.stopBoundsListener();
    if (this.view) {
      this.view.setVisible(false);
    }
  }

  reload() {
    if (this.view) {
      this.view.webContents.reload();
    }
  }

  invalidateLayout() {
    if (!this.window) {
      return;
    }
    if (!this.view) {
      return;
    }

    const windowBounds = windowsBounds.get(this.window);
    if (windowBounds) {
      this.view.setBounds({
        x: windowBounds.x,
        y: windowBounds.y,
        width: windowBounds.width,
        height: windowBounds.height
      });
      this.view.setBorderRadius(8);
    }
  }

  startBoundsListener() {
    this.stopBoundsListener();
    if (this.window) {
      // Listen for resize events to update layout
      this.window.on("resize", this.invalidateLayout);

      // Listen for bounds changes
      this.boundsListener = () => {
        if (this.window) {
          this.invalidateLayout();
        }
      };

      windowsBoundsEmitter.on(`bounds-changed-${this.window.id}`, this.boundsListener);
    }
  }

  stopBoundsListener() {
    if (this.window) {
      this.window.off("resize", this.invalidateLayout);

      if (this.boundsListener) {
        windowsBoundsEmitter.off(`bounds-changed-${this.window.id}`, this.boundsListener);
        this.boundsListener = null;
      }
    }
  }
}

export class Tabs extends EventEmitter {
  window: BrowserWindow | undefined;
  tabList: Tab[] = [];
  selected: Tab | null | undefined = null;
  destroyOnNoTabs: boolean = false;
  constructor(browserWindow: BrowserWindow) {
    super();
    this.window = browserWindow;
  }

  destroy() {
    this.tabList.forEach((tab) => {
      tab.destroy();
    });
    this.tabList = [];

    this.selected = undefined;

    if (this.window) {
      if (!this.window.isDestroyed()) {
        this.window.destroy();
      }
      this.window = undefined;
    }
  }

  get(tabId: number) {
    return this.tabList.find((tab) => tab.id === tabId);
  }

  create(webContentsViewOptions: Electron.WebContentsViewConstructorOptions = {}) {
    if (!this.window) {
      throw new Error("Tabs.create: window is not set");
    }

    const tab = new Tab(this.window, webContentsViewOptions);
    this.tabList.push(tab);
    if (!this.selected) this.selected = tab;
    tab.show(); // must be attached to window
    this.emit("tab-created", tab);
    this.select(tab.id);
    return tab;
  }

  remove(tabId: number) {
    const tabIndex = this.tabList.findIndex((tab) => tab.id === tabId);
    if (tabIndex < 0) {
      throw new Error(`Tabs.remove: unable to find tab.id = ${tabId}`);
    }
    const tab = this.tabList[tabIndex];
    this.tabList.splice(tabIndex, 1);
    tab.destroy();
    if (this.selected === tab) {
      this.selected = undefined;
      const nextTab = this.tabList[tabIndex] || this.tabList[tabIndex - 1];
      if (nextTab) this.select(nextTab.id);
    }
    this.emit("tab-destroyed", tab);

    if (this.destroyOnNoTabs && this.tabList.length === 0) {
      this.destroy();
    }
  }

  select(tabId: number) {
    const tab = this.get(tabId);
    if (!tab) return;
    if (this.selected) this.selected.hide();
    tab.show();
    this.selected = tab;
    this.emit("tab-selected", tab);
  }
}

// IPC Handlers //
ipcMain.on("set-page-bounds", (event, bounds: { x: number; y: number; width: number; height: number }) => {
  const webContents = event.sender;
  const window = BrowserWindow.fromWebContents(webContents);

  if (window) {
    windowsBounds.set(window, bounds);
    // Emit an event when bounds are updated
    windowsBoundsEmitter.emit(`bounds-changed-${window.id}`, bounds);
  }
});
