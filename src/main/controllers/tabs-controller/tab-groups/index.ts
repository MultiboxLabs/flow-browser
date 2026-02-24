import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { Tab } from "../tab";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { type GlanceTabGroup } from "./glance";
import { type SplitTabGroup } from "./split";
import { type TabsController } from "@/controllers/tabs-controller";

// Interfaces and Types
export type TabGroupEvents = {
  "tab-added": [number];
  "tab-removed": [number];
  "space-changed": [];
  "window-changed": [];
  changed: [];
  destroyed: [];
};

function getTabFromId(tabsController: TabsController, id: number): Tab | null {
  const tab = tabsController.getTabById(id);
  if (!tab) {
    return null;
  }
  return tab;
}

// Tab Group Class
export type TabGroup = GlanceTabGroup | SplitTabGroup;

export class BaseTabGroup extends TypedEventEmitter<TabGroupEvents> {
  /** String identifier used as map key, persistence key, and Tab.groupId value */
  public readonly groupId: string;
  public isDestroyed: boolean = false;

  public windowId: number;
  public profileId: string;
  public spaceId: string;

  protected tabsController: TabsController;
  protected tabIds: number[] = [];

  constructor(tabsController: TabsController, groupId: string, initialTabs: [Tab, ...Tab[]]) {
    super();

    this.tabsController = tabsController;
    this.groupId = groupId;

    const initialTab = initialTabs[0];

    this.windowId = initialTab.getWindow().id;
    this.profileId = initialTab.profileId;
    this.spaceId = initialTab.spaceId;

    for (const tab of initialTabs) {
      this.addTab(tab.id);
    }

    // Change space of all tabs in the group
    this.on("space-changed", () => {
      for (const tab of this.tabs) {
        if (tab.spaceId !== this.spaceId) {
          tab.setSpace(this.spaceId);
        }
      }
    });
  }

  public setSpace(spaceId: string) {
    this.errorIfDestroyed();

    this.spaceId = spaceId;
    this.emit("space-changed");
    this.emit("changed");

    for (const tab of this.tabs) {
      this.syncTab(tab);
    }
  }

  public setWindow(windowId: number) {
    this.errorIfDestroyed();

    this.windowId = windowId;
    this.emit("window-changed");
    this.emit("changed");

    for (const tab of this.tabs) {
      this.syncTab(tab);
    }
  }

  public syncTab(tab: Tab) {
    this.errorIfDestroyed();

    tab.setSpace(this.spaceId);

    const window = browserWindowsController.getWindowById(this.windowId);
    if (window) {
      tab.setWindow(window);
    }
  }

  protected errorIfDestroyed() {
    if (this.isDestroyed) {
      throw new Error("TabGroup already destroyed!");
    }
  }

  public hasTab(tabId: number): boolean {
    this.errorIfDestroyed();

    return this.tabIds.includes(tabId);
  }

  public addTab(tabId: number) {
    this.errorIfDestroyed();

    if (this.hasTab(tabId)) {
      return false;
    }

    const tab = getTabFromId(this.tabsController, tabId);
    if (tab === null) {
      return false;
    }

    tab.groupId = this.groupId;

    this.tabIds.push(tabId);
    this.emit("tab-added", tabId);
    this.emit("changed");

    // Event Listeners
    const onTabDestroyed = () => {
      this.removeTab(tabId);
    };
    const onTabRemoved = (tabId: number) => {
      if (tabId === tab.id) {
        disconnectAll();
      }
    };
    const onTabSpaceChanged = () => {
      const newSpaceId = tab.spaceId;
      if (newSpaceId !== this.spaceId) {
        this.setSpace(newSpaceId);
      }
    };
    const onTabWindowChanged = () => {
      const newWindowId = tab.getWindow()?.id;
      if (newWindowId !== this.windowId) {
        this.setWindow(newWindowId);
      }
    };
    const onActiveTabChanged = (windowId: number, spaceId: string) => {
      if (windowId === this.windowId && spaceId === this.spaceId) {
        const activeTab = this.tabsController.getActiveTab(windowId, spaceId);
        if (activeTab === tab) {
          // Set this tab group as active instead of just the tab
          // @ts-expect-error: the base class won't be used directly anyways
          this.tabsController.setActiveTab(this);
        }
      }
    };
    const onDestroy = () => {
      disconnectAll();
    };

    const disconnectAll = () => {
      disconnect1();
      disconnect2();
      disconnect3();
      disconnect4();
      disconnect5();
      disconnect6();
    };
    const disconnect1 = tab.connect("destroyed", onTabDestroyed);
    const disconnect2 = this.connect("tab-removed", onTabRemoved);
    const disconnect3 = tab.connect("space-changed", onTabSpaceChanged);
    const disconnect4 = tab.connect("window-changed", onTabWindowChanged);
    const disconnect5 = this.tabsController.connect("active-tab-changed", onActiveTabChanged);
    const disconnect6 = this.connect("destroyed", onDestroy);

    // Sync tab space and window
    this.syncTab(tab);
    return true;
  }

  public removeTab(tabId: number) {
    this.errorIfDestroyed();

    if (!this.hasTab(tabId)) {
      return false;
    }

    // Clear the groupId on the tab being removed
    const tab = getTabFromId(this.tabsController, tabId);
    if (tab && tab.groupId === this.groupId) {
      tab.groupId = null;
    }

    this.tabIds = this.tabIds.filter((id) => id !== tabId);
    this.emit("tab-removed", tabId);
    this.emit("changed");
    return true;
  }

  public get tabs(): Tab[] {
    this.errorIfDestroyed();

    const tabsController = this.tabsController;
    return this.tabIds
      .map((id) => {
        return getTabFromId(tabsController, id);
      })
      .filter((tab) => tab !== null);
  }

  public get position(): number {
    this.errorIfDestroyed();
    return this.tabs[0].position;
  }

  public destroy() {
    this.errorIfDestroyed();

    // Clear groupId for all tabs in the group before destroying
    for (const tab of this.tabs) {
      if (tab.groupId === this.groupId) {
        tab.groupId = null;
      }
    }

    this.isDestroyed = true;
    this.emit("destroyed");
    this.destroyEmitter();
  }
}
