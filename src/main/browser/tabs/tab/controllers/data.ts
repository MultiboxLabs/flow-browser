import { Tab } from "@/browser/tabs/tab";
import { TabbedBrowserWindow } from "@/browser/window";

export class TabDataController {
  private readonly tab: Tab;

  public window: TabbedBrowserWindow | null = null;
  public space: string | null = null;
  public pipActive: boolean = false;

  constructor(tab: Tab) {
    this.tab = tab;

    tab.on("window-changed", () => this.refreshData());
    tab.on("space-changed", () => this.refreshData());
    tab.on("pip-active-changed", () => this.refreshData());
  }

  public refreshData() {
    let changed = false;

    const tab = this.tab;

    // Window
    const window = tab.window.get();
    if (this.window !== window) {
      this.window = window;
      changed = true;
    }

    // Space
    const space = tab.space.get();
    if (this.space !== space) {
      this.space = space;
      changed = true;
    }

    // Picture in Picture
    const pipActive = tab.pip.active;
    if (this.pipActive !== pipActive) {
      this.pipActive = pipActive;
      changed = true;
    }

    // Process changes
    if (changed) {
      this.tab.emit("data-changed");
    }
    return changed;
  }

  public get() {
    return {
      window: this.window,
      space: this.space,
      pipActive: this.pipActive
    };
  }
}
