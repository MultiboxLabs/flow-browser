import { Tab } from "@/browser/tabs/tab";
import { TabGroup } from "@/browser/tabs/tab-group";

/**
 * Controller responsible for managing the focused tab within a tab group.
 * Handles setting/removing the focused tab.
 */
export class TabGroupFocusedTabController {
  /** Reference to the tab group this controller manages */
  private readonly tabGroup: TabGroup;

  /** ID of the focused tab in this tab group. */
  private focusedTabId: string | null = null;

  /**
   * Creates a new TabGroupFocusedTabController instance.
   * @param tabGroup - The tab group this controller will manage
   */
  constructor(tabGroup: TabGroup) {
    this.tabGroup = tabGroup;

    this._setupEventListeners();
  }

  private _setupEventListeners() {
    this.tabGroup.connect("tab-added", (tab) => {
      if (!this.focusedTabId) {
        this.set(tab);
      }
    });

    this.tabGroup.connect("tab-removed", (tab) => {
      if (this.focusedTabId === tab.id) {
        this.remove();

        const tabGroup = this.tabGroup;
        const tabs = tabGroup.tabs.get();
        if (tabs.length > 0) {
          this.set(tabs[0]);
        }
      }
    });
  }

  public set(tab: Tab) {
    if (this.focusedTabId === tab.id) {
      return false;
    }

    this.remove();
    this.focusedTabId = tab.id;
    return true;
  }

  public remove() {
    if (this.focusedTabId) {
      this.focusedTabId = null;
      return true;
    }
    return false;
  }
}
