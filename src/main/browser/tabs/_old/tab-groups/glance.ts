import { BaseTabGroup } from "@/browser/tabs/tab-groups";

export class GlanceTabGroup extends BaseTabGroup {
  public frontTabId: number = -1;
  public mode: "glance" = "glance" as const;

  constructor(...args: ConstructorParameters<typeof BaseTabGroup>) {
    super(...args);

    this.on("tab-removed", () => {
      if (this.tabIds.length !== 2) {
        // A glance tab group must have 2 tabs
        this.destroy();
      }
    });
  }

  public setFrontTab(tabId: number) {
    this.frontTabId = tabId;
  }
}
