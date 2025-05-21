import { BaseTabGroup } from "./index";

export class NormalTabGroup extends BaseTabGroup {
  public mode: "normal" = "normal" as const;

  /**
   * Override addTab to enforce single tab limit
   */
  public addTab(tabId: number): boolean {
    if (this.tabs.length > 0) {
      console.warn("Normal tab group can only contain one tab");
      return false;
    }
    return super.addTab(tabId);
  }
}
