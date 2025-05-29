import { Browser } from "@/browser/browser";
import { LoadedProfile } from "@/browser/profile-manager";
import {
  TabBoundsController,
  TabPipController,
  TabSavingController,
  TabSpaceController,
  TabStateController,
  TabVisiblityController,
  TabWebviewController,
  TabWindowController,
  TabContextMenuController,
  TabErrorPageController,
  TabNavigationController,
  TabDataController,
  TabSleepController
} from "@/browser/tabs/tab/controllers";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { generateID } from "@/modules/utils";
import { NavigationEntry } from "electron";
import { PageBounds } from "~/flow/types";

type TabEvents = {
  "window-changed": [];
  "space-changed": [];
  "webview-attached": [];
  "webview-detached": [];
  "pip-active-changed": [boolean];
  "bounds-changed": [PageBounds];
  "visiblity-changed": [boolean];
  "sleep-changed": [];
  "data-changed": [];
  destroyed: [];
};

interface TabCreationDetails {
  browser: Browser;

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

  public window: TabWindowController;
  public space: TabSpaceController;

  public data: TabDataController;
  public state: TabStateController;

  public bounds: TabBoundsController;
  public visiblity: TabVisiblityController;

  public webview: TabWebviewController;
  public pip: TabPipController;
  public saving: TabSavingController;
  public contextMenu: TabContextMenuController;
  public errorPage: TabErrorPageController;
  public navigation: TabNavigationController;
  public sleep: TabSleepController;

  constructor(details: TabCreationDetails) {
    super();

    this.id = details.tabId ?? generateID();
    this.loadedProfile = details.loadedProfile;
    this.creationDetails = details;
    this.destroyed = false;

    this.browser = details.browser;
    this.profileId = details.loadedProfile.profileId;

    this.window = new TabWindowController(this);
    this.space = new TabSpaceController(this);

    this.data = new TabDataController(this);
    this.state = new TabStateController(this);

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
    if (this.destroyed) {
      throw new Error("Tab already destroyed");
    }

    this.destroyed = true;
    this.webview.detach();
    this.emit("destroyed");
  }

  public throwIfDestroyed() {
    if (this.destroyed) {
      throw new Error("Tab already destroyed");
    }
  }
}
