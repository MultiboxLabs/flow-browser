import { Browser } from "@/browser/browser";
import { TabGroupManager } from "@/browser/tabs/managers/tab-group-manager";
import { ActiveTabGroupManager } from "@/browser/tabs/managers/active-tab-group-manager";
import { TabManager } from "@/browser/tabs/managers/tab-manager";
import { TabsContainerManager } from "@/browser/tabs/managers/tabs-container-manager";

export class TabOrchestrator {
  public readonly tabManager: TabManager;
  public readonly tabGroupManager: TabGroupManager;
  public readonly activeTabGroupManager: ActiveTabGroupManager;
  public readonly tabsContainerManager: TabsContainerManager;

  constructor(browser: Browser) {
    this.tabManager = new TabManager(browser);
    this.tabGroupManager = new TabGroupManager(browser);
    this.activeTabGroupManager = new ActiveTabGroupManager(browser);
    this.tabsContainerManager = new TabsContainerManager(browser);
  }

  public destroy(): void {
    this.tabManager.destroy();
    this.tabGroupManager.destroy();
  }
}
