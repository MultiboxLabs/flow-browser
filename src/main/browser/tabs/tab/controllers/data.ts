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
  public audible: boolean = false;
  public muted: boolean = false;
  public url: string = "";
  public isLoading: boolean = true;

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

    // Process changes
    if (changed) {
      this.tab.emit("data-changed");
    }
    return changed;
  }

  public setupWebviewData(webContents: WebContents) {
    // audible
    webContents.on("audio-state-changed", () => {});
    webContents.on("media-started-playing", () => {});
    webContents.on("media-paused", () => {});

    // title
    webContents.on("page-title-updated", () => {});

    // isLoading
    webContents.on("did-finish-load", () => {});
    webContents.on("did-start-loading", () => {});
    webContents.on("did-stop-loading", () => {});

    // url
    webContents.on("did-finish-load", () => {});
    webContents.on("did-start-navigation", () => {});
    webContents.on("did-redirect-navigation", () => {});
    webContents.on("did-navigate-in-page", () => {});
  }

  private onWebviewDetached() {
    return false;
  }

  public get() {
    const tab = this.tab;
    const navHistory = tab.navigation.navHistory;
    const navHistoryIndex = tab.navigation.navHistoryIndex;

    return {
      window: this.window,
      pipActive: this.pipActive,
      asleep: this.asleep,
      navHistory: navHistory,
      navHistoryIndex: navHistoryIndex
    };
  }
}
