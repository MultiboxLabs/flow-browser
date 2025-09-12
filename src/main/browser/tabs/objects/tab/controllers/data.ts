/*
TabDataController:
- This controller stores all the data that needs to be synced with the frontend
*/

import { Tab } from "@/browser/tabs/objects/tab";
import { TabbedBrowserWindow } from "@/browser/window";
import { WebContents } from "electron";

type PropertiesFromOtherControllers = "window" | "pipActive" | "asleep";
type PropertiesFromWebview = "title" | "url" | "isLoading" | "audible" | "muted";

type TabDataProperties = PropertiesFromOtherControllers | PropertiesFromWebview;

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

    // Wait for every controller to be ready
    setImmediate(() => this.refreshData());
  }

  private emitDataChanged() {
    this.tab.emit("data-changed");
  }

  public refreshData() {
    let changed = false;

    const tab = this.tab;

    const setProperty = <T extends TabDataProperties>(property: T, value: TabDataController[T]) => {
      if (this[property] !== value) {
        this[property] = value as this[T];
        changed = true;
      }
    };

    /// From other controllers ///

    // Window
    const window = tab.window.get();
    setProperty("window", window);

    // Picture in Picture
    const pipActive = tab.pip.active;
    setProperty("pipActive", pipActive);

    // asleep
    const asleep = tab.sleep.asleep;
    setProperty("asleep", asleep);

    /// From webview ///

    const webContents = tab.webview.webContents;
    if (webContents) {
      // title
      const title = webContents.getTitle();
      setProperty("title", title);

      // url
      const url = webContents.getURL();
      setProperty("url", url);

      // isLoading
      const isLoading = webContents.isLoading();
      setProperty("isLoading", isLoading);

      // audible
      const audible = webContents.isCurrentlyAudible();
      setProperty("audible", audible);

      // muted
      const muted = webContents.isAudioMuted();
      setProperty("muted", muted);
    }

    /// Finalise ///

    // Process changes
    if (changed) {
      this.emitDataChanged();
    }
    return changed;
  }

  public setupWebviewChangeHooks(webContents: WebContents) {
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
