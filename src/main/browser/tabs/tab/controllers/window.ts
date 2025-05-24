import { Tab } from "@/browser/tabs/tab";
import { TabbedBrowserWindow } from "@/browser/window";

export class TabWindowController {
  private readonly tab: Tab;
  private window: TabbedBrowserWindow | null = null;

  constructor(tab: Tab) {
    this.tab = tab;
  }

  public get() {
    return this.window;
  }

  public set(window: TabbedBrowserWindow) {
    if (this.window === window) {
      return false;
    }

    this.window = window;
    this.tab.emit("window-changed");
    return true;
  }
}
