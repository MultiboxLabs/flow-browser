import {
  app,
  session,
  BrowserWindow,
  dialog,
  WebContents,
  ipcMain,
  OpenExternalPermissionRequest,
  nativeTheme
} from "electron";
import path from "path";
import fs from "fs";
import { ElectronChromeExtensions } from "electron-chrome-extensions";
import { buildChromeContextMenu } from "electron-chrome-context-menu";
import { installChromeWebStore, loadAllExtensions } from "electron-chrome-web-store";

// Import local modules
import { Tabs } from "./tabs";
import { setupMenu } from "./menu";
import { FLAGS } from "../modules/flags";
import { Omnibox } from "./omnibox";
import { registerProtocolsWithSession } from "./protocols";
import { FLOW_DATA_DIR, PATHS } from "../modules/paths";
import { debugError, debugPrint } from "../modules/output";
import { generateBrowserWindowData, windowEvents, WindowEventType } from "../modules/windows";
import "../modules/icons";

let webuiExtensionId: string | undefined;

interface TabbedBrowserWindowOptions {
  session?: Electron.Session;
  extensions: ElectronChromeExtensions;
  window: Electron.BrowserWindowConstructorOptions;
  urls: { newtab: string };
  initialUrl?: string;
}

interface Sender extends Electron.WebContents {
  getOwnerBrowserWindow(): Electron.BrowserWindow | null;
}

function getParentWindowOfTab(tab: WebContents): BrowserWindow {
  switch (tab.getType()) {
    case "window":
      return BrowserWindow.fromWebContents(tab) as BrowserWindow;
    case "browserView":
    case "webview":
      const owner = (tab as Sender).getOwnerBrowserWindow();
      if (!owner) throw new Error("Unable to find owner window");
      return owner;
    case "backgroundPage":
      return BrowserWindow.getFocusedWindow() as BrowserWindow;
    default:
      throw new Error(`Unable to find parent window of '${tab.getType()}'`);
  }
}

export class TabbedBrowserWindow {
  private session: Electron.Session;
  private extensions: ElectronChromeExtensions;
  private window: BrowserWindow;
  tabs: Tabs;
  omnibox: Omnibox;
  public id: number;
  public webContents: WebContents;

  constructor(options: TabbedBrowserWindowOptions) {
    this.session = options.session || session.defaultSession;
    this.extensions = options.extensions;

    // Can't inherit BrowserWindow
    // https://github.com/electron/electron/issues/23#issuecomment-19613241
    this.window = new BrowserWindow(options.window);
    this.id = this.window.id;
    this.webContents = this.window.webContents;

    // Load the WebUI extension
    this.loadWebUI();

    this.tabs = new Tabs(this.window);

    const self = this;

    this.tabs.on("tab-created", function onTabCreated(tab) {
      tab.loadURL(options.urls.newtab);

      // Track tab that may have been created outside of the extensions API.
      self.extensions.addTab(tab.webContents, tab.window);
    });

    this.tabs.on("tab-destroyed", function onTabDestroyed(tab) {
      // Track tab that may have been destroyed outside of the extensions API.
      self.extensions.removeTab(tab.webContents);
    });

    this.tabs.on("tab-selected", function onTabSelected(tab) {
      self.extensions.selectTab(tab.webContents);
    });

    if (webuiExtensionId) {
      this.omnibox = new Omnibox(this.window, webuiExtensionId);
    }

    queueMicrotask(() => {
      // If you do not create a tab, ElectronChromeExtensions will not register the new window.
      // This is such a weird behavior, but oh well.

      // Create initial tab
      const tab = this.tabs.create();

      if (options.initialUrl) {
        tab.loadURL(options.initialUrl);
      }
    });
  }

  async loadWebUI(): Promise<void> {
    if (webuiExtensionId) {
      debugPrint("VITE_UI_EXTENSION", "Loading WebUI from extension");

      // const webuiUrl = "flow-utility://page/error?url=http://abc.com&initial=1";
      // const webuiUrl = `chrome-extension://${webuiExtensionId}/error/index.html?url=http://abc.com&initial=1`;
      const webuiUrl = `chrome-extension://${webuiExtensionId}/main/index.html`;
      await this.webContents.loadURL(webuiUrl);
      await this.webContents.insertCSS(
        `:root, html, body {
  background: unset !important;
  background-color: unset !important;
  color: unset !important;
}`,
        { cssOrigin: "author" }
      );
    } else {
      debugError("VITE_UI_EXTENSION", "WebUI extension ID not available");
    }
  }

  getBrowserWindow(): BrowserWindow {
    return this.window;
  }

  destroy(): void {
    this.tabs.destroy();

    if (!this.window.isDestroyed()) {
      this.window.destroy();
    }
  }

  getFocusedTab() {
    return this.tabs.selected;
  }
}

interface BrowserUrls {
  newtab: string;
}

export class Browser {
  private windows: TabbedBrowserWindow[] = [];
  private urls: BrowserUrls = {
    newtab: "about:blank"
  };
  private ready: Promise<void>;
  private readyResolved: boolean = false;
  private resolveReady!: () => void;
  private session!: Electron.Session;
  private extensions!: ElectronChromeExtensions;
  private popup?: { browserWindow?: BrowserWindow; parent: BrowserWindow };

  constructor() {
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    this.ready.then(() => {
      this.readyResolved = true;
    });

    app.whenReady().then(this.init.bind(this));

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        this.destroy();
      }
    });

    app.on("activate", () => {
      // Not ready yet, don't create a window
      if (!this.readyResolved) return;

      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) this.createInitialWindow();
    });

    app.on("web-contents-created", this.onWebContentsCreated.bind(this));
  }

  destroy(): void {
    app.quit();
  }

  getWindows(): TabbedBrowserWindow[] {
    return this.windows;
  }

  getFocusedWindow(): TabbedBrowserWindow | undefined {
    return this.windows.find((w) => w.getBrowserWindow().isFocused()) || this.windows[0];
  }

  getWindowFromBrowserWindow(window: BrowserWindow): TabbedBrowserWindow | null {
    return !window.isDestroyed() ? this.windows.find((win) => win.id === window.id) || null : null;
  }

  getWindowFromWebContents(webContents: WebContents): TabbedBrowserWindow | null {
    let window: BrowserWindow | undefined;

    if (this.popup && webContents === this.popup.browserWindow?.webContents) {
      window = this.popup.parent;
    } else {
      window = getParentWindowOfTab(webContents);
    }

    return window ? this.getWindowFromBrowserWindow(window) : null;
  }

  async init(): Promise<void> {
    this.initSession();
    setupMenu(this);

    if ("registerPreloadScript" in this.session) {
      this.session.registerPreloadScript({
        id: "flow-preload",
        type: "frame",
        filePath: PATHS.PRELOAD
      });
    } else {
      // TODO(mv3): remove
      const session = this.session as Electron.Session;
      session.setPreloads([PATHS.PRELOAD]);
    }

    this.extensions = new ElectronChromeExtensions({
      license: "GPL-3.0",
      session: this.session,

      createTab: async (details) => {
        await this.ready;

        const win = typeof details.windowId === "number" && this.windows.find((w) => w.id === details.windowId);

        if (!win) {
          throw new Error(`Unable to find windowId=${details.windowId}`);
        }

        const tab = win.tabs.create();

        if (details.url) tab.loadURL(details.url);
        if (typeof details.active === "boolean" ? details.active : true) win.tabs.select(tab.id);

        return [tab.webContents, tab.window];
      },
      selectTab: (tab, browserWindow: BrowserWindow) => {
        const win = this.getWindowFromBrowserWindow(browserWindow);
        win?.tabs.select(tab.id);
      },
      removeTab: (tab, browserWindow: BrowserWindow) => {
        const win = this.getWindowFromBrowserWindow(browserWindow);
        win?.tabs.remove(tab.id);
      },

      createWindow: async (details) => {
        await this.ready;

        const tabsToOpen: string[] = [];
        if (typeof details.url === "string") {
          tabsToOpen.push(details.url);
        } else if (Array.isArray(details.url)) {
          tabsToOpen.push(...details.url);
        }

        const win = this.createWindow({
          initialUrl: tabsToOpen[0]
        });

        for (const url of tabsToOpen.slice(1)) {
          const tab = win.tabs.create();
          tab.loadURL(url);
        }

        return win.getBrowserWindow();
      },
      removeWindow: (browserWindow: BrowserWindow) => {
        const win = this.getWindowFromBrowserWindow(browserWindow);
        win?.destroy();
      }
    });

    this.extensions.on("browser-action-popup-created", (popup) => {
      this.popup = popup;
    });

    // Allow extensions to override new tab page
    this.extensions.on("url-overrides-updated", (urlOverrides) => {
      if (urlOverrides.newtab) {
        this.urls.newtab = urlOverrides.newtab;
      }
    });

    // Load the Vite WebUI extension first
    try {
      const viteWebUIPath = PATHS.VITE_WEBUI;
      if (fs.existsSync(viteWebUIPath) && fs.existsSync(path.join(viteWebUIPath, "manifest.json"))) {
        debugPrint("VITE_UI_EXTENSION", "Loading Vite WebUI extension from:", viteWebUIPath);
        const viteExtension = await this.session.loadExtension(viteWebUIPath);
        webuiExtensionId = viteExtension.id;
        debugPrint("VITE_UI_EXTENSION", "Vite WebUI extension loaded with ID:", webuiExtensionId);
      } else {
        throw new Error("Vite WebUI extension not found");
      }
    } catch (error) {
      debugError("VITE_UI_EXTENSION", "Error loading Vite WebUI extension:", error);
    }

    // Wait for web store extensions to finish loading as they may change the
    // newtab URL.
    await installChromeWebStore({
      session: this.session,
      async beforeInstall(details) {
        if (!details.browserWindow || details.browserWindow.isDestroyed()) return;

        const title = `Add "${details.localizedName}"?`;

        let message = `${title}`;
        if (details.manifest.permissions) {
          const permissions = (details.manifest.permissions || []).join(", ");
          message += `\n\nPermissions: ${permissions}`;
        }

        const returnValue = await dialog.showMessageBox(details.browserWindow, {
          title,
          message,
          icon: details.icon,
          buttons: ["Cancel", "Add Extension"]
        });

        return { action: returnValue.response === 0 ? "deny" : "allow" };
      }
    });

    if (!app.isPackaged) {
      await loadAllExtensions(this.session, PATHS.LOCAL_EXTENSIONS, {
        allowUnpacked: true
      });
    }

    await app.whenReady();

    await Promise.all(
      this.session.getAllExtensions().map(async (extension) => {
        const manifest = extension.manifest;
        if (manifest.manifest_version === 3 && manifest?.background?.service_worker) {
          debugPrint("EXTENSION_SERVER_WORKERS", "Starting service worker for scope", extension.url);
          await this.session.serviceWorkers.startWorkerForScope(extension.url).catch((error) => {
            debugError("EXTENSION_SERVER_WORKERS", "Error starting service worker for scope", extension.url, error);
          });
          debugPrint("EXTENSION_SERVER_WORKERS", "Service worker started for scope", extension.url);
        }
      })
    );

    this.createInitialWindow();
    this.resolveReady();
  }

  initSession(): void {
    // this.session = session.defaultSession;

    const profileName = "main";
    const sessionPath = path.join(FLOW_DATA_DIR, "Profiles", profileName);
    this.session = session.fromPath(sessionPath);

    registerProtocolsWithSession(this.session);

    this.session.setPermissionRequestHandler((webContents, permission, callback, details) => {
      debugPrint("PERMISSIONS", "permission request", webContents?.getURL() || "unknown-url", permission);

      if (permission === "openExternal") {
        const openExternalDetails = details as OpenExternalPermissionRequest;

        const externalAppName =
          app.getApplicationNameForProtocol(openExternalDetails.externalURL) || "an unknown application";

        const url = new URL(openExternalDetails.requestingUrl);
        const minifiedUrl = `${url.protocol}//${url.host}`;

        dialog
          .showMessageBox({
            message: `${minifiedUrl} wants to open ${externalAppName}. Continue?`,
            buttons: ["Cancel", "Open"]
          })
          .then((response) => {
            if (response.response === 1) {
              callback(true);
            } else {
              callback(false);
            }
          });

        return;
      }

      callback(true);
    });

    this.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
      debugPrint("PERMISSIONS", "permission check", webContents?.getURL() || "unknown-url", permission);
      return true;
    });

    // Remove Electron and App details to closer emulate Chrome's UA
    if (FLAGS.SCRUBBED_USER_AGENT) {
      const userAgent = this.session
        .getUserAgent()
        .replace(/\sElectron\/\S+/, "")
        .replace(new RegExp(`\\s${app.getName()}/\\S+`, "i"), "");
      this.session.setUserAgent(userAgent);
    }

    this.session.serviceWorkers.on("running-status-changed", (event) => {
      debugPrint("EXTENSION_SERVER_WORKERS", `service worker ${event.versionId} ${event.runningStatus}`);
    });

    if (process.env.FLOW_DEBUG) {
      this.session.serviceWorkers.once("running-status-changed", () => {
        const tab = this.windows[0]?.getFocusedTab();
        if (tab) {
          tab.webContents.inspectServiceWorker();
        }
      });
    }
  }

  createWindow(options: Partial<TabbedBrowserWindowOptions> = {}): TabbedBrowserWindow {
    const win = new TabbedBrowserWindow({
      ...options,
      session: this.session,
      urls: this.urls,
      extensions: this.extensions,
      window: {
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
          contextIsolation: true,
          session: this.session
        },
        frame: false,
        transparent: false,
        resizable: true,
        backgroundColor: "#00000000",
        visualEffectState: "followWindow",
        vibrancy: "fullscreen-ui", // on MacOS
        // backgroundMaterial: "acrylic", // on Windows (Disabled as it interferes with rounded corners)
        roundedCorners: true
      }
    });

    this.windows.push(win);

    // Emit window added event
    windowEvents.emit(WindowEventType.ADDED, generateBrowserWindowData(win));

    win.getBrowserWindow().on("close", () => {
      this.windows = this.windows.filter((w) => w.id !== win.id);
      win.destroy();
    });

    win.getBrowserWindow().on("closed", () => {
      this.windows = this.windows.filter((w) => w.id !== win.id);

      // Emit window removed event
      windowEvents.emit(WindowEventType.REMOVED, generateBrowserWindowData(win));
    });

    if (process.env.FLOW_DEBUG) {
      win.webContents.openDevTools({ mode: "detach" });
    }

    return win;
  }

  createInitialWindow(): void {
    this.createWindow();
  }

  async onWebContentsCreated(_event: Event, webContents: WebContents): Promise<void> {
    const type = webContents.getType();
    const url = webContents.getURL();
    debugPrint("WEB_CONTENTS_CREATED", `'web-contents-created' event [type:${type}, url:${url || "unknown-url"}]`);

    if (webContents.session == session.defaultSession) {
      return;
    }

    if (process.env.FLOW_DEBUG && ["backgroundPage", "remote"].includes(webContents.getType())) {
      webContents.openDevTools({ mode: "detach", activate: true });
    }

    webContents.setWindowOpenHandler((details) => {
      switch (details.disposition) {
        case "foreground-tab":
        case "background-tab":
        case "new-window": {
          return {
            action: "allow",
            outlivesOpener: true,
            createWindow: (constructionOptions) => {
              const win = this.getWindowFromWebContents(webContents);
              if (!win) throw new Error("Unable to find window for web contents");
              const tab = win.tabs.create(constructionOptions);
              tab.loadURL(details.url);
              return tab.webContents;
            }
          };
        }
        default:
          return { action: "allow" };
      }
    });

    webContents.on("context-menu", (_event, params) => {
      const menu = buildChromeContextMenu({
        params,
        webContents,
        extensionMenuItems: this.extensions.getContextMenuItems(webContents, params),
        openLink: (url, disposition) => {
          const win = this.getFocusedWindow();
          if (!win) return;

          switch (disposition) {
            case "new-window":
              this.createWindow({ initialUrl: url });
              break;
            default:
              const tab = win.tabs.create();
              tab.loadURL(url);
          }
        }
      });

      menu.popup();
    });
  }
}

// IPC Handlers //
ipcMain.on("set-window-button-position", (event, position: { x: number; y: number }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && "setWindowButtonPosition" in win) {
    win.setWindowButtonPosition(position);
  }
});

ipcMain.on("set-window-button-visibility", (event, visible: boolean) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && "setWindowButtonVisibility" in win) {
    win.setWindowButtonVisibility(visible);
  }
});

ipcMain.handle("get-app-info", async () => {
  return {
    version: app.getVersion(),
    packaged: app.isPackaged
  };
});
