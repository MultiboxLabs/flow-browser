import { BaseTabGroup } from "@/browser/tabs/tab-groups";

export class GlanceTabGroup extends BaseTabGroup {
  public frontTabId: number = -1;
  public mode: "glance" = "glance";

  public setFrontTab(tabId: number) {
    this.frontTabId = tabId;
  }
}
