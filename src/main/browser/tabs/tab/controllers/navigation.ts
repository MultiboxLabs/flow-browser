import { Tab } from "@/browser/tabs/tab";
import { NavigationEntry, WebContents } from "electron";

export const DEFAULT_URL = "flow://new-tab";

export function generateNavHistoryWithURL(url: string): NavigationEntry[] {
  const entry: NavigationEntry = {
    title: "",
    url: url
  };
  return [entry];
}

export class TabNavigationController {
  private readonly tab: Tab;

  public navHistory: NavigationEntry[];
  private _navHistoryIndex?: number;

  constructor(tab: Tab) {
    const creationDetails = tab.creationDetails;

    this.tab = tab;

    const defaultUrl = creationDetails.defaultURL ?? DEFAULT_URL;
    this.navHistory = creationDetails.navHistory ?? generateNavHistoryWithURL(defaultUrl);
    this._navHistoryIndex = creationDetails.navHistoryIndex;
  }

  public get navHistoryIndex(): number {
    return this._navHistoryIndex ?? this.navHistory.length - 1;
  }

  public setupNavigation(webContents: WebContents) {
    // Restore the navigation history
    webContents.navigationHistory.restore({
      entries: this.navHistory,
      index: this.navHistoryIndex
    });
  }

  // Not really sync: This replaces the one stored with the webview's latest records
  public syncNavHistory() {
    const tab = this.tab;
    const webContents = tab.webview.webContents;
    if (!webContents) {
      return false;
    }

    const navHistory = webContents.navigationHistory.getAllEntries();
    const activeIndex = webContents.navigationHistory.getActiveIndex();

    this.navHistory = navHistory;
    this._navHistoryIndex = activeIndex;

    return true;
  }

  public loadUrl(url: string, replace: boolean = false) {
    const tab = this.tab;
    const webContents = tab.webview.webContents;
    if (!webContents) {
      const navHistoryIndex = this.navHistoryIndex;
      if (replace && navHistoryIndex >= 0) {
        // Replace the current entry if replace is true
        this.navHistory[navHistoryIndex] = {
          title: "",
          url: url
        };
      } else {
        // Otherwise insert a new entry after the current position
        this.navHistory.splice(navHistoryIndex + 1, 0, {
          title: "",
          url: url
        });
        // Remove any forward history
        if (navHistoryIndex < this.navHistory.length - 2) {
          this.navHistory = this.navHistory.slice(0, navHistoryIndex + 2);
        }
        this._navHistoryIndex = navHistoryIndex + 1;
      }
      return true;
    }

    // Only run this if replace is true
    const activeIndex = replace ? webContents.navigationHistory.getActiveIndex() : undefined;

    webContents.loadURL(url);

    // Remove the record at the old index if replace is true
    if (activeIndex !== undefined) {
      webContents.navigationHistory.removeEntryAtIndex(activeIndex);
    }

    // Might not be needed, but just to be safe
    this.syncNavHistory();

    return true;
  }
}
