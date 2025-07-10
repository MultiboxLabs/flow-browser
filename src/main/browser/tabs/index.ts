import { Browser } from "@/browser/browser";
import { TabGroupManager } from "@/browser/tabs/managers/tab-group-manager";
import { ActiveTabGroupManager } from "@/browser/tabs/managers/active-tab-group-manager";
import { TabManager } from "@/browser/tabs/managers/tab-manager";

export class TabOrchestrator {
  private readonly browser: Browser;
  public readonly tabManager: TabManager;
  public readonly tabGroupManager: TabGroupManager;
  public readonly activeTabGroupManager: ActiveTabGroupManager;

  constructor(browser: Browser) {
    this.browser = browser;
    this.tabManager = new TabManager(browser);
    this.tabGroupManager = new TabGroupManager(browser);
    this.activeTabGroupManager = new ActiveTabGroupManager(browser);
  }

  public destroy(): void {
    this.tabManager.destroy();
    this.tabGroupManager.destroy();
  }
}
