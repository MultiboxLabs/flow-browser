import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { generateID } from "@/modules/utils";
import { Tab } from "@/browser/tabs/tab";
import { TabGroupFocusedTabController, TabGroupTabsController } from "@/browser/tabs/tab-group/controllers";
import { Browser } from "@/browser/browser";
import { TabbedBrowserWindow } from "@/browser/window";

type TabGroupTypes = "normal" | "split" | "glance";

type TabGroupEvents = {
  "window-changed": [];
  "space-changed": [];
  "tab-added": [Tab];
  "tab-removed": [Tab];
  destroyed: [];
};

export interface TabGroupCreationDetails {
  browser: Browser;

  window: TabbedBrowserWindow;
  spaceId: string;
}

export interface TabGroupVariant {
  type: TabGroupTypes;
  maxTabs: number;
}

export class TabGroup extends TypedEventEmitter<TabGroupEvents> {
  public readonly id: string;
  public destroyed: boolean;

  public readonly type: TabGroupTypes;
  public readonly maxTabs: number;
  public readonly creationDetails: TabGroupCreationDetails;

  protected tabIds: string[] = [];

  public tabs: TabGroupTabsController;
  public focusedTab: TabGroupFocusedTabController;

  constructor(variant: TabGroupVariant, details: TabGroupCreationDetails) {
    super();

    this.id = generateID();
    this.destroyed = false;

    this.type = variant.type;
    this.maxTabs = variant.maxTabs;
    this.creationDetails = details;

    this.tabs = new TabGroupTabsController(this);
    this.focusedTab = new TabGroupFocusedTabController(this);
  }

  public destroy() {
    this.throwIfDestroyed();

    this.destroyed = true;
    this.emit("destroyed");

    this.tabs.cleanupListeners();

    this.destroyEmitter();
  }

  public throwIfDestroyed() {
    if (this.destroyed) {
      throw new Error("Tab group already destroyed");
    }
  }
}
