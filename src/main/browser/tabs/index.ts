import { Browser } from "@/browser/browser";
import { TabGroupManager } from "@/browser/tabs/tab-group-manager";
import { TabManager } from "@/browser/tabs/tab-manager";

export class TabOrchestrator {
  private readonly browser: Browser;
  public readonly tabManager: TabManager;
  public readonly tabGroupManager: TabGroupManager;

  constructor(browser: Browser) {
    this.browser = browser;
    this.tabManager = new TabManager(browser);
    this.tabGroupManager = new TabGroupManager(browser);
  }

  public destroy(): void {
    this.tabManager.destroy();
    this.tabGroupManager.destroy();
  }
}
