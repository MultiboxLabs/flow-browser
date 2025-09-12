/*
TabWindowController:
- This controller is responsible for managing the window of the tab
- Methods should be called by the Tab Container.
*/

import { Tab } from "@/browser/tabs/objects/tab";
import { TabbedBrowserWindow } from "@/browser/window";

const TAB_ZINDEX = 2;

export class TabWindowController {
  private readonly tab: Tab;
  private window: TabbedBrowserWindow;

  private oldWindow: TabbedBrowserWindow | null = null;

  constructor(tab: Tab) {
    this.tab = tab;

    const creationDetails = tab.creationDetails;
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
    this.tab.emit("window-changed");

    this.updateWebviewWindow();

    return true;
  }

  // Trigged on:
  // - Window being set (tab.window.set)
  // - Webview being attached (tab.webview.attach)
  public updateWebviewWindow() {
    const tab = this.tab;

    const webContentsView = tab.webview.webContentsView;
    if (!webContentsView) {
      return false;
    }

    const window = tab.window.get();

    // Remove the view from the old window
    if (this.oldWindow && this.oldWindow !== window) {
      this.oldWindow.viewManager.removeView(webContentsView);
    }

    // Add the view to the new window if it exists
    if (window) {
      window.viewManager.addOrUpdateView(webContentsView, TAB_ZINDEX);
    }

    // Update the old window
    this.oldWindow = window;

    return true;
  }
}
