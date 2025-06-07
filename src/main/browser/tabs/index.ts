import { Browser } from "@/browser/browser";
import { TabManager } from "@/browser/tabs/tab-manager";

export class TabOrchestrator {
  private readonly browser: Browser;
  public readonly tabManager: TabManager;

  constructor(browser: Browser) {
    this.browser = browser;
    this.tabManager = new TabManager(browser);
  }

  public destroy(): void {
    this.tabManager.destroy();
  }
}
