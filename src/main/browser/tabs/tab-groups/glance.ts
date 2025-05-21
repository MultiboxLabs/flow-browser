import { BaseTabGroup } from "./index";
import { TabGroupData } from "~/types/tabs";

export class GlanceTabGroup extends BaseTabGroup {
  public frontTabId: number = -1;
  public mode: "glance" = "glance" as const;

  constructor(...args: ConstructorParameters<typeof BaseTabGroup>) {
    super(...args);

    if (this.tabs.length > 0) {
      this.frontTabId = this.tabs[0].id;
    }

    this.on("tab-removed", (tabId) => {
      if (this.frontTabId === tabId && this.tabs.length > 0) {
        this.setFrontTab(this.tabs[0].id);
      }

      if (this.tabIds.length !== 2) {
        // A glance tab group must have 2 tabs
        this.destroy();
      }
    });

    this.on("tab-added", (tabId) => {
      if (this.tabs.length === 1) {
        this.setFrontTab(tabId);
      }

      if (this.tabs.length > 2) {
        const extraTab = this.tabs.find((tab) => tab.id !== this.frontTabId && tab.id !== tabId);
        if (extraTab) {
          this.removeTab(extraTab.id);
        }
      }
    });
  }

  /**
   * Set which tab is in front
   */
  public setFrontTab(tabId: number) {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    this.frontTabId = tabId;

    for (const t of this.tabs) {
      t.updateLayout();
    }

    this.saveTabGroup();
  }

  /**
   * Get tab group data with glance-specific properties
   */
  public override getData(): TabGroupData {
    const data = super.getData();
    return {
      ...data,
      glanceFrontTabId: this.frontTabId
    };
  }
}
