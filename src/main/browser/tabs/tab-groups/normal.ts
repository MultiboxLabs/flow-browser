import { Browser } from "@/browser/browser";
import { Tab } from "@/browser/tabs/tab";
import { TabManager } from "@/browser/tabs/tab-manager";
import { BaseTabGroup } from "../tab-groups";

export class NormalTabGroup extends BaseTabGroup {
  public readonly mode = "normal" as const;
  
  constructor(browser: Browser, tabManager: TabManager, id: number, initialTabs: [Tab, ...Tab[]]) {
    super(browser, tabManager, id, initialTabs);
    
    this.on("tab-removed", () => {
      if (this.tabIds.length === 0) {
        this.destroy();
      }
    });
  }
}
