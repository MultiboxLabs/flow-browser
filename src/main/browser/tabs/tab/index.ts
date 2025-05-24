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
  TabDataController
} from "@/browser/tabs/tab/controllers";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { generateID } from "@/modules/utils";
import { NavigationEntry } from "electron";

type TabEvents = {
  "window-changed": [];
  "space-changed": [];
  "webview-attached": [];
  "webview-detached": [];
  "pip-active-changed": [boolean];
  "data-changed": [];
  destroyed: [];
};

interface TabCreationDetails {
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

  public creationDetails: TabCreationDetails;

  public window: TabWindowController;
  public space: TabSpaceController;

  public data: TabDataController;
  public state: TabStateController;

  public webview: TabWebviewController;
  public pip: TabPipController;
  public bounds: TabBoundsController;
  public visiblity: TabVisiblityController;
  public saving: TabSavingController;
  public contextMenu: TabContextMenuController;
  public errorPage: TabErrorPageController;
  public navigation: TabNavigationController;

  constructor(details: TabCreationDetails) {
    super();

    this.id = details.tabId ?? generateID();
    this.loadedProfile = details.loadedProfile;
    this.creationDetails = details;

    this.window = new TabWindowController(this);
    this.space = new TabSpaceController(this);

    this.data = new TabDataController(this);
    this.state = new TabStateController(this);

    this.webview = new TabWebviewController(this);
    this.pip = new TabPipController(this);
    this.bounds = new TabBoundsController(this);
    this.visiblity = new TabVisiblityController(this);
    this.saving = new TabSavingController(this);
    this.contextMenu = new TabContextMenuController(this);
    this.errorPage = new TabErrorPageController(this);
    this.navigation = new TabNavigationController(this);
  }

  public destroy() {
    this.emit("destroyed");
  }
}
