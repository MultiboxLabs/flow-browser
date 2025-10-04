/*
TabBoundsController:
- This controller is responsible for managing the bounds of the tab
- Methods should be called by the Tab Container.
*/

import { Tab } from "@/browser/tabs/objects/tab";
import { PageBounds } from "~/flow/types";

export class TabBoundsController {
  private readonly tab: Tab;

  /**
   * Whether the tab is currently animating.
   * When animating, the size of the bounds will not be updated.
   * This is because there are a lot of complex calculations done in the tab when animating, which cause performance issues.
   */
  public isAnimating: boolean;

  /**
   * The bounds of the tab.
   */
  private bounds: PageBounds;

  constructor(tab: Tab) {
    this.tab = tab;

    this.isAnimating = false;
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
  }

  public startAnimating() {
    this.isAnimating = true;
  }

  public stopAnimating() {
    this.isAnimating = false;
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
