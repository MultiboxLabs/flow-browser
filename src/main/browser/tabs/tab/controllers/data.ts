import { Tab } from "@/browser/tabs/tab";
import { TabbedBrowserWindow } from "@/browser/window";
import { WebContents } from "electron";

export class TabDataController {
  private readonly tab: Tab;

  // from other controllers
  public window: TabbedBrowserWindow | null = null;
  public pipActive: boolean = false;
  public asleep: boolean = false;

  // from webview (recorded here)
  public title: string = "";
  public url: string = "";
  public isLoading: boolean = true;
  public audible: boolean = false;
  public muted: boolean = false;

  // recorded here
  // none currently

  constructor(tab: Tab) {
    this.tab = tab;

    tab.on("window-changed", () => this.refreshData());
    tab.on("pip-active-changed", () => this.refreshData());
    tab.on("sleep-changed", () => this.refreshData());
    tab.on("nav-history-changed", () => this.emitDataChanged());

    tab.on("webview-detached", () => this.onWebviewDetached());

    setImmediate(() => this.refreshData());
  }

  private emitDataChanged() {
    this.tab.emit("data-changed");
  }

  public refreshData() {
    let changed = false;

    const tab = this.tab;

    /// From other controllers ///

    // Window
    const window = tab.window.get();
    if (this.window !== window) {
      this.window = window;
      changed = true;
    }

    // Picture in Picture
    const pipActive = tab.pip.active;
    if (this.pipActive !== pipActive) {
      this.pipActive = pipActive;
      changed = true;
    }

    // Asleep
    const asleep = tab.sleep.asleep;
    if (this.asleep !== asleep) {
      this.asleep = asleep;
      changed = true;
    }

    /// From webview ///
    const webContents = tab.webview.webContents;

    if (webContents) {
      // Title
      const title = webContents.getTitle();
      if (this.title !== title) {
        this.title = title;
        changed = true;
      }

      // URL
      const url = webContents.getURL();
      if (this.url !== url) {
        this.url = url;
        changed = true;
      }

      // isLoading
      const isLoading = webContents.isLoading();
      if (this.isLoading !== isLoading) {
        this.isLoading = isLoading;
        changed = true;
      }

      // audible
      const audible = webContents.isAudioMuted();
      if (this.audible !== audible) {
        this.audible = audible;
        changed = true;
      }

      // muted
      const muted = webContents.isAudioMuted();
      if (this.muted !== muted) {
        this.muted = muted;
        changed = true;
      }
    }

    /// Finalise ///

    // Process changes
    if (changed) {
      this.tab.emit("data-changed");
    }
    return changed;
  }

  public setupWebviewData(webContents: WebContents) {
    // audible
    webContents.on("audio-state-changed", () => this.refreshData());
    webContents.on("media-started-playing", () => this.refreshData());
    webContents.on("media-paused", () => this.refreshData());

    // title
    webContents.on("page-title-updated", () => this.refreshData());

    // isLoading
    webContents.on("did-finish-load", () => this.refreshData());
    webContents.on("did-start-loading", () => this.refreshData());
    webContents.on("did-stop-loading", () => this.refreshData());

    // url
    webContents.on("did-finish-load", () => this.refreshData());
    webContents.on("did-start-navigation", () => this.refreshData());
    webContents.on("did-redirect-navigation", () => this.refreshData());
    webContents.on("did-navigate-in-page", () => this.refreshData());
  }

  private onWebviewDetached() {
    return false;
  }

  public get() {
    const tab = this.tab;
    const navHistory = tab.navigation.navHistory;
    const navHistoryIndex = tab.navigation.navHistoryIndex;

    return {
      // from other controllers
      window: this.window,
      pipActive: this.pipActive,
      asleep: this.asleep,

      // from navigation
      navHistory: navHistory,
      navHistoryIndex: navHistoryIndex,

      // from webview
      title: this.title,
      url: this.url,
      isLoading: this.isLoading,
      audible: this.audible,
      muted: this.muted
    };
  }
}
