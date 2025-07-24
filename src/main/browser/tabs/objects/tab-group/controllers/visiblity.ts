import { TabGroup } from "@/browser/tabs/objects/tab-group";

export class TabGroupVisiblityController {
  private readonly tabGroup: TabGroup;

  public isVisible: boolean;

  constructor(tabGroup: TabGroup) {
    this.tabGroup = tabGroup;

    this.isVisible = false;

    tabGroup.on("tab-added", (tab) => {
      tab.visiblity.setVisible(this.isVisible);
    });

    tabGroup.on("tab-removed", (tab) => {
      tab.visiblity.setVisible(this.isVisible);
    });
  }

  /**
   * Set the visibility of the tab group
   * @param visible - Whether the tab group should be visible
   */
  public setVisible(visible: boolean) {
    this.isVisible = visible;
    this.updateTabsVisibility();
  }

  /**
   * Update the visibility of all tabs in the tab group
   */
  public updateTabsVisibility() {
    const tabs = this.tabGroup.tabs.get();
    for (const tab of tabs) {
      tab.visiblity.setVisible(this.isVisible);
    }
  }
}
