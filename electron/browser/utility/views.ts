import { BrowserWindow, View, WebContentsView } from "electron";

type ViewData = {
  view: View;
  index: number;
};

export class ViewsManager {
  private window: BrowserWindow;
  private contentView: View;
  private views: Map<number, ViewData>;

  constructor(window: BrowserWindow) {
    this.window = window;
    this.contentView = window.contentView;
    this.views = new Map();
  }

  add(view: WebContentsView, index: number) {
    const id = view.webContents.id;
    this.views.set(id, { view, index });
    this.contentView.addChildView(view, index);
  }

  remove(view: WebContentsView) {
    const id = view.webContents.id;
    this.views.delete(id);
    this.contentView.removeChildView(view);
  }
}
