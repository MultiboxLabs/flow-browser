import { Browser } from "@/browser/browser";
import { TabGroup } from "@/browser/tabs/tab-group";
import { TabbedBrowserWindow } from "@/browser/window";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";

type ActiveTabGroupManagerEvents = {
  destroyed: [];
};

export class ActiveTabGroupManager extends TypedEventEmitter<ActiveTabGroupManagerEvents> {
  public isDestroyed: boolean = false;

  private readonly browser: Browser;
  private windowSpaceActiveTabGroup: Map<`${string}-${string}`, TabGroup>;

  constructor(browser: Browser) {
    super();
    this.browser = browser;
    this.windowSpaceActiveTabGroup = new Map();

    browser.on("window-created", this._onNewWindow);
    for (const window of browser.getWindows()) {
      this._onNewWindow(window);
    }
  }

  private _onNewWindow(window: TabbedBrowserWindow) {
    const refresh = () => {
      this._updateActiveTabGroup(window);
    };
    refresh();
    window.on("current-space-changed", refresh);
  }

  private _updateActiveTabGroup(window: TabbedBrowserWindow) {
    const windowSpace = window.getCurrentSpace();
    for (const [key, tabGroup] of this.windowSpaceActiveTabGroup.entries()) {
      if (key === `${window.id}-${windowSpace}`) {
        tabGroup.visiblity.setVisible(true);
      } else if (key.startsWith(`${window.id}-`)) {
        tabGroup.visiblity.setVisible(false);
      }
    }
  }

  public setActiveTabGroup(tabGroup: TabGroup) {
    const window = tabGroup.window.get();
    const windowSpace = window.getCurrentSpace();
    this.windowSpaceActiveTabGroup.set(`${window.id}-${windowSpace}`, tabGroup);
    this._updateActiveTabGroup(window);
  }

  /**
   * Destroy the tab group manager
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.emit("destroyed");

    // TODO: Destroy all tab groups

    this.destroyEmitter();
  }
}
