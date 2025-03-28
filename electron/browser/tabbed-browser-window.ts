import { BrowserWindow, WebContents, nativeTheme, session } from "electron";
import { ElectronChromeExtensions } from "electron-chrome-extensions";
import { debugError, debugPrint } from "@/modules/output";
import { Tabs } from "./tabs";
import { Omnibox } from "./omnibox";
import { webuiExtensionId } from "./utils";

export interface TabbedBrowserWindowOptions {
  session?: Electron.Session;
  extensions: ElectronChromeExtensions;
  window: Electron.BrowserWindowConstructorOptions;
  urls: { newtab: string };
  initialUrl?: string;
}

export class TabbedBrowserWindow {
  private session: Electron.Session;
  private extensions: ElectronChromeExtensions;
  private window: BrowserWindow;
  tabs: Tabs;
  omnibox?: Omnibox;
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

    if (webuiExtensionId()) {
      this.omnibox = new Omnibox(this.window, webuiExtensionId()!);
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
    if (webuiExtensionId()) {
      debugPrint("VITE_UI_EXTENSION", "Loading WebUI from extension");

      const webuiUrl = `chrome-extension://${webuiExtensionId()}/main/index.html`;
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
