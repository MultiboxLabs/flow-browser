import { Tab } from "@/browser/tabs/tab";
import { PageBounds } from "~/flow/types";

export class TabBoundsController {
  private readonly tab: Tab;

  private bounds: PageBounds;

  constructor(tab: Tab) {
    this.tab = tab;

    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
  }

  public set(bounds: PageBounds) {
    this.bounds = bounds;
    this.tab.emit("bounds-changed", bounds);

    this.updateWebviewBounds();
  }

  public get() {
    return this.bounds;
  }

  // Trigged on:
  // - Bounds being set (tab.bounds.set)
  // - Visibility being set (tab.visiblity.setVisible)
  // - Webview being attached (tab.webview.attach)
  public updateWebviewBounds() {
    // Only update the bounds if the tab is visible for performance
    if (!this.tab.visiblity.isVisible) {
      return false;
    }

    const tab = this.tab;

    const webContentsView = tab.webview.webContentsView;
    if (!webContentsView) {
      return false;
    }

    const bounds = tab.bounds.get();
    webContentsView.setBounds(bounds);
    return true;
  }
}
