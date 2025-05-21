import { Tab } from "@/browser/tabs/tab";
import { GlanceTabGroup } from "@/browser/tabs/tab-groups/glance";
import { SplitTabGroup } from "@/browser/tabs/tab-groups/split";
import { TabManager } from "@/browser/tabs/tab-manager";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { Browser } from "@/browser/browser";

// Interfaces and Types
export type TabGroupEvents = {
  "tab-added": [number];
  "tab-removed": [number];
  "space-changed": [];
  "window-changed": [];
  destroy: [];
};

function getTabFromId(tabManager: TabManager, id: number): Tab | null {
  const tab = tabManager.getTabById(id);
  if (!tab) {
    return null;
  }
  return tab;
}

// Tab Group Class
export type TabGroup = GlanceTabGroup | SplitTabGroup;

export class BaseTabGroup extends TypedEventEmitter<TabGroupEvents> {
  public readonly id: number;
  public isDestroyed: boolean = false;

  public windowId: number;
  public profileId: string;
  public spaceId: string;

  protected browser: Browser;
  protected tabManager: TabManager;
  protected tabIds: number[] = [];

  constructor(browser: Browser, tabManager: TabManager, id: number, initialTabs: [Tab, ...Tab[]]) {
    super();

    this.browser = browser;
    this.tabManager = tabManager;
    this.id = id;

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

    for (const tab of this.tabs) {
      this.syncTab(tab);
    }
  }

  public setWindow(windowId: number) {
    this.errorIfDestroyed();

    this.windowId = windowId;
    this.emit("window-changed");

    for (const tab of this.tabs) {
      this.syncTab(tab);
    }
  }

  public syncTab(tab: Tab) {
    this.errorIfDestroyed();

    tab.setSpace(this.spaceId);

    const window = this.browser.getWindowById(this.windowId);
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

    const tab = getTabFromId(this.tabManager, tabId);
    if (tab === null) {
      return false;
    }

    tab.groupId = this.id;

    this.tabIds.push(tabId);
    this.emit("tab-added", tabId);

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
        const activeTab = this.tabManager.getActiveTab(windowId, spaceId);
        if (activeTab === tab) {
          // Set this tab group as active instead of just the tab
          // @ts-expect-error: the base class won't be used directly anyways
          this.tabManager.setActiveTab(this);
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
    const disconnect5 = this.tabManager.connect("active-tab-changed", onActiveTabChanged);
    const disconnect6 = this.connect("destroy", onDestroy);

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
    const tab = getTabFromId(this.tabManager, tabId);
    if (tab && tab.groupId === this.id) {
      tab.groupId = null;
    }

    this.tabIds = this.tabIds.filter((id) => id !== tabId);
    this.emit("tab-removed", tabId);
    return true;
  }

  public get tabs(): Tab[] {
    this.errorIfDestroyed();

    const tabManager = this.tabManager;
    return this.tabIds
      .map((id) => {
        return getTabFromId(tabManager, id);
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
      if (tab.groupId === this.id) {
        tab.groupId = null;
      }
    }

    this.isDestroyed = true;
    this.emit("destroy");
    this.destroyEmitter();
  }
}
