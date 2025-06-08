import { TabGroup } from "@/browser/tabs/tab-group";
import { TabbedBrowserWindow } from "@/browser/window";

export class TabGroupWindowController {
  private readonly tabGroup: TabGroup;
  private window: TabbedBrowserWindow;

  constructor(tabGroup: TabGroup) {
    this.tabGroup = tabGroup;

    const creationDetails = tabGroup.creationDetails;
    this.window = creationDetails.window;
  }

  public get() {
    return this.window;
  }

  public set(window: TabbedBrowserWindow) {
    if (this.window === window) {
      return false;
    }

    this.window = window;
    this.tabGroup.emit("window-changed");

    this.updateTabsWindow();

    return true;
  }

  // Overrides the windows of all tabs in the tab group
  public updateTabsWindow() {
    const tabGroup = this.tabGroup;

    const tabs = tabGroup.tabs.get();
    for (const tab of tabs) {
      tab.window.set(this.window);
    }

    return true;
  }
}
