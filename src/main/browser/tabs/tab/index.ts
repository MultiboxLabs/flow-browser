import { Browser } from "@/browser/browser";
import { LoadedProfile } from "@/browser/profile-manager";
import {
  TabBoundsController,
  TabPipController,
  TabSavingController,
  TabVisiblityController,
  TabWebviewController,
  TabWindowController,
  TabContextMenuController,
  TabErrorPageController,
  TabNavigationController,
  TabDataController,
  TabSleepController
} from "@/browser/tabs/tab/controllers";
import { TabbedBrowserWindow } from "@/browser/window";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { generateID } from "@/modules/utils";
import { NavigationEntry } from "electron";
import { PageBounds } from "~/flow/types";

type TabEvents = {
  "window-changed": [];
  "webview-attached": [];
  "webview-detached": [];
  "pip-active-changed": [boolean];
  "bounds-changed": [PageBounds];
  "visiblity-changed": [boolean];
  "sleep-changed": [];
  "nav-history-changed": [];
  "data-changed": [];

  focused: [];

  destroyed: [];
};

export interface TabCreationDetails {
  browser: Browser;

  window: TabbedBrowserWindow;
  spaceId: string;

  tabId?: string;
  loadedProfile: LoadedProfile;
  webContentsViewOptions: Electron.WebContentsViewConstructorOptions;

  navHistory?: NavigationEntry[];
  navHistoryIndex?: number;
  defaultURL?: string;

  asleep?: boolean;
}

export class Tab extends TypedEventEmitter<TabEvents> {
  public readonly id: string;
  public readonly loadedProfile: LoadedProfile;
  public readonly creationDetails: TabCreationDetails;
  public destroyed: boolean;

  public readonly browser: Browser;
  public readonly profileId: string;

  public readonly window: TabWindowController;

  public readonly data: TabDataController;

  public readonly bounds: TabBoundsController;
  public readonly visiblity: TabVisiblityController;

  public readonly webview: TabWebviewController;
  public readonly pip: TabPipController;
  public readonly saving: TabSavingController;
  public readonly contextMenu: TabContextMenuController;
  public readonly errorPage: TabErrorPageController;
  public readonly navigation: TabNavigationController;
  public readonly sleep: TabSleepController;

  constructor(details: TabCreationDetails) {
    super();

    this.id = details.tabId ?? generateID();
    this.loadedProfile = details.loadedProfile;
    this.creationDetails = details;
    this.destroyed = false;

    this.browser = details.browser;
    this.profileId = details.loadedProfile.profileId;

    this.window = new TabWindowController(this);

    this.data = new TabDataController(this);

    this.bounds = new TabBoundsController(this);
    this.visiblity = new TabVisiblityController(this);

    this.webview = new TabWebviewController(this);
    this.pip = new TabPipController(this);
    this.saving = new TabSavingController(this);
    this.contextMenu = new TabContextMenuController(this);
    this.errorPage = new TabErrorPageController(this);
    this.navigation = new TabNavigationController(this);
    this.sleep = new TabSleepController(this);
  }

  public destroy() {
    this.throwIfDestroyed();

    this.destroyed = true;
    this.webview.detach();
    this.emit("destroyed");

    this.destroyEmitter();
  }

  public throwIfDestroyed() {
    if (this.destroyed) {
      throw new Error("Tab already destroyed");
    }
  }
}
