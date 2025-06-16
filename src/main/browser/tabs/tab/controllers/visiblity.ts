import { Tab } from "@/browser/tabs/tab";

export class TabVisiblityController {
  private readonly tab: Tab;

  public isVisible: boolean;

  constructor(tab: Tab) {
    this.tab = tab;

    this.isVisible = false;
  }

  public setVisible(visible: boolean) {
    if (this.isVisible === visible) {
      return false;
    }

    this.isVisible = visible;
    this.tab.emit("visiblity-changed", visible);

    this.tab.bounds.updateWebviewBounds();

    return true;
  }

  // Trigged on:
  // - Visibility being set (tab.visiblity.setVisible)
  // - Webview being attached (tab.webview.attach)
  public updateWebviewVisiblity() {
    const tab = this.tab;
    const webContentsView = tab.webview.webContentsView;
    if (!webContentsView) {
      return false;
    }

    webContentsView.setVisible(this.isVisible);
    return true;
  }
}
