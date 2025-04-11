import { Rectangle, WebContentsView } from "electron";

export class GlanceModal {
  public readonly view: WebContentsView;

  constructor() {
    const view = new WebContentsView({
      webPreferences: {
        transparent: true
      }
    });
    view.setBorderRadius(8);

    const webContents = view.webContents;
    webContents.loadURL("flow-internal://glance-modal/");

    view.setVisible(false);
    this.view = view;
  }

  public setBounds(bounds: Rectangle) {
    this.view.setBounds(bounds);
  }

  public setVisible(visible: boolean) {
    this.view.setVisible(visible);
  }

  public destroy() {
    this.view.webContents.close();
  }
}
