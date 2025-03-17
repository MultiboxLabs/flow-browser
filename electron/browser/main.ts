import { app, session, BrowserWindow, dialog, WebContents, Menu, protocol } from "electron";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { ElectronChromeExtensions } from "electron-chrome-extensions";
import { buildChromeContextMenu } from "electron-chrome-context-menu";
import { installChromeWebStore, loadAllExtensions } from "electron-chrome-web-store";

// Import local modules
import { Tabs } from "./tabs";
import { setupMenu } from "./menu";
import { FLAGS } from "../modules/flags";
import { getContentType } from "./utils";

// Constants
const FLOW_ROOT_DIR = path.join(__dirname, "../../");
const ROOT_DIR = path.join(FLOW_ROOT_DIR, "../");

interface Paths {
  ASSETS: string;
  VITE_WEBUI: string;
  PRELOAD: string;
  LOCAL_EXTENSIONS: string;
}

const PATHS: Paths = {
  ASSETS: app.isPackaged
    ? path.resolve(process.resourcesPath as string, "assets")
    : path.resolve(FLOW_ROOT_DIR, "assets"),
  VITE_WEBUI: app.isPackaged ? path.resolve(process.resourcesPath as string) : path.resolve(ROOT_DIR, "vite"),
  PRELOAD: path.join(FLOW_ROOT_DIR, "renderer", "browser", "preload.js"),
  LOCAL_EXTENSIONS: path.join(ROOT_DIR, "extensions")
};

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

class TabbedBrowserWindow {
  private session: Electron.Session;
  private extensions: ElectronChromeExtensions;
  private window: BrowserWindow;
  tabs: Tabs;
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

    queueMicrotask(() => {
      // Create initial tab
      const tab = this.tabs.create();

      if (options.initialUrl) {
        tab.loadURL(options.initialUrl);
      }
    });
  }

  async loadWebUI(): Promise<void> {
    if (webuiExtensionId) {
      console.log("Loading WebUI from extension");
      const webuiUrl = `chrome-extension://${webuiExtensionId}/main/index.html`;
      await this.webContents.loadURL(webuiUrl);
    } else {
      console.error("WebUI extension ID not available");
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
      const viteWebUIPath = path.join(PATHS.VITE_WEBUI, "dist");
      if (fs.existsSync(viteWebUIPath) && fs.existsSync(path.join(viteWebUIPath, "manifest.json"))) {
        console.log("Loading Vite WebUI extension from:", viteWebUIPath);
        const viteExtension = await this.session.loadExtension(viteWebUIPath);
        webuiExtensionId = viteExtension.id;
        console.log("Vite WebUI extension loaded with ID:", webuiExtensionId);
      } else {
        throw new Error("Vite WebUI extension not found");
      }
    } catch (error) {
      console.error("Error loading Vite WebUI extension:", error);
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
          console.log("[LAUNCHER] Starting service worker for scope", extension.url);
          await this.session.serviceWorkers.startWorkerForScope(extension.url).catch((error) => {
            console.error("[LAUNCHER] Error starting service worker for scope", extension.url, error);
          });
          console.log("[LAUNCHER] Service worker started for scope", extension.url);
        }
      })
    );

    this.createInitialWindow();
    this.resolveReady();
  }

  initSession(): void {
    this.session = session.defaultSession;

    // Remove Electron and App details to closer emulate Chrome's UA
    if (FLAGS.SCRUBBED_USER_AGENT) {
      const userAgent = this.session
        .getUserAgent()
        .replace(/\sElectron\/\S+/, "")
        .replace(new RegExp(`\\s${app.getName()}/\\S+`, "i"), "");
      this.session.setUserAgent(userAgent);
    }

    this.session.serviceWorkers.on("running-status-changed", (event) => {
      console.info(`service worker ${event.versionId} ${event.runningStatus}`);
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
      urls: this.urls,
      extensions: this.extensions,
      window: {
        width: 1280,
        height: 720,
        frame: false,
        titleBarStyle: "hidden",
        titleBarOverlay: {
          height: 31,
          color: "#39375b",
          symbolColor: "#ffffff"
        },
        webPreferences: {
          sandbox: true,
          nodeIntegration: false,
          contextIsolation: true
        }
      }
    });

    this.windows.push(win);
    win.getBrowserWindow().on("close", () => {
      this.windows = this.windows.filter((w) => w.id !== win.id);
      win.destroy();
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
    console.log(`'web-contents-created' event [type:${type}, url:${url}]`);

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
            createWindow: ({ webPreferences }) => {
              const win = this.getWindowFromWebContents(webContents);
              if (!win) throw new Error("Unable to find window for web contents");
              const tab = win.tabs.create({
                webPreferences
              });
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

app.whenReady().then(() => {
  protocol.handle("flow-utility", async (request) => {
    const urlString = request.url;

    // Extract the entire path correctly from custom protocol URL
    // For flow-utility://error/index.html, we need "error/index.html"
    const fullPath = urlString.substring(urlString.indexOf("://") + 3);
    const urlPath = fullPath.split("?")[0]; // Remove query parameters

    console.log("urlPath", urlPath);

    // Check if this is a page request (starts with /page)
    if (!urlPath.startsWith("page/")) {
      return new Response("Invalid request path", { status: 400 });
    }

    // Remove the /page prefix to get the actual path
    const pagePath = urlPath.substring(5); // Remove "page/"
    console.log("pagePath", pagePath);

    // Build file path and check if it exists
    let filePath = path.join(PATHS.VITE_WEBUI, "dist", pagePath);

    try {
      // Check if path exists
      const stats = await fsPromises.stat(filePath);

      // If direct file is a directory, try serving index.html from that directory
      if (stats.isDirectory()) {
        const indexPath = path.join(filePath, "index.html");
        try {
          await fsPromises.access(indexPath);
          filePath = indexPath;
        } catch (error) {
          // Index.html doesn't exist in directory
          return new Response("Directory index not found", { status: 404 });
        }
      }

      // Read file contents
      const buffer = await fsPromises.readFile(filePath);

      // Determine content type based on file extension
      const contentType = getContentType(filePath);

      return new Response(buffer, {
        headers: {
          "Content-Type": contentType
        }
      });
    } catch (error) {
      console.error("Error serving file:", error);
      return new Response("File not found", { status: 404 });
    }
  });
});
