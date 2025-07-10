import { Browser } from "@/browser/browser";
import { Tab } from "@/browser/tabs/objects/tab";
import { TabGroup } from "@/browser/tabs/objects/tab-group";
import { NormalTabGroup } from "@/browser/tabs/objects/tab-group/types/normal";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getSpacesFromProfile } from "@/sessions/spaces";

type TabGroupManagerEvents = {
  "tab-group-created": [TabGroup];
  "tab-group-removed": [TabGroup];
  destroyed: [];
};

export class TabGroupManager extends TypedEventEmitter<TabGroupManagerEvents> {
  public tabGroups: Map<string, TabGroup> = new Map();
  public isDestroyed: boolean = false;

  private readonly browser: Browser;

  constructor(browser: Browser) {
    super();
    this.browser = browser;

    const tabOrchestrator = browser.tabs;

    // Setup event listeners
    this.on("tab-group-created", (tabGroup) => {
      tabGroup.on("destroyed", () => {
        this._removeTabGroup(tabGroup);
      });
    });

    tabOrchestrator.tabManager.on("tab-created", async (tab) => {
      const space = await this._getFirstSpace(tab.profileId);
      if (space) {
        this._createBasicTabGroup(tab, space);
      }
    });

    this.on("tab-group-removed", (tabGroup) => {
      const tabs = tabGroup.tabs.get();
      for (const tab of tabs) {
        this._createBasicTabGroup(tab, tabGroup.creationDetails.space);
      }
    });
  }

  private async _getFirstSpace(profileId: string): Promise<string | undefined> {
    const spaces = await getSpacesFromProfile(profileId);
    if (spaces.length > 0) {
      return spaces[0].id;
    }
    return undefined;
  }

  /**
   * Create a basic tab group for a tab
   * @param tab - The tab to create a tab group for
   */
  private _createBasicTabGroup(tab: Tab, space: string) {
    const window = tab.window.get();
    const tabGroup = new NormalTabGroup({
      browser: this.browser,
      window: window,
      space: space
    });
    tabGroup.tabs.addTab(tab);
    this.addTabGroup(tabGroup);
  }

  /**
   * Add a tab group to the manager
   * @param tabGroup - The tab group to add
   */
  public addTabGroup(tabGroup: TabGroup) {
    this.tabGroups.set(tabGroup.id, tabGroup);
    this.emit("tab-group-created", tabGroup);
  }

  /**
   * Get a tab group from a tab
   */
  public getTabGroupFromTab(tab: Tab): TabGroup | undefined {
    for (const tabGroup of this.tabGroups.values()) {
      if (tabGroup.tabs.hasTab(tab.id)) {
        return tabGroup;
      }
    }

    return undefined;
  }

  /**
   * Remove a tab group from the manager
   * @param tabGroup - The tab group to remove
   * @internal Should not be used directly, use `tabGroup.destroy()` instead
   */
  private _removeTabGroup(tabGroup: TabGroup) {
    this.tabGroups.delete(tabGroup.id);
    this.emit("tab-group-removed", tabGroup);
  }

  /**
   * Get all tab groups
   * @returns All tab groups
   */
  public getTabGroups(): TabGroup[] {
    return Array.from(this.tabGroups.values());
  }

  /**
   * Destroy the tab group manager
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.emit("destroyed");

    // Destroy all tab groups
    for (const tabGroup of this.tabGroups.values()) {
      tabGroup.destroy();
    }

    this.destroyEmitter();
  }
}
