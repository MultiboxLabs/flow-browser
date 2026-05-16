import { Layer, LayerManager } from "@/controllers/windows-controller/layer-manager";

export class FakeWebContentsViewLayer extends Layer<Electron.WebContentsView> {
  constructor(
    manager: LayerManager,
    webContents: Electron.WebContents,
    zIndex: number,
    focusPriority: number,
    modalTo?: (zIndex: number) => boolean
  ) {
    const fakeView: Pick<Electron.WebContentsView, "webContents"> = {
      webContents: webContents
    };

    super(manager, fakeView as Electron.WebContentsView, zIndex, focusPriority, modalTo);
  }

  public override isWebContentsView(): this is Layer<Electron.WebContentsView> {
    return true;
  }

  public override isVisible(): boolean {
    return true;
  }
  public override setVisible(visible: boolean) {
    // no-op: not a real view
    void visible;
  }

  public override addThisAsChildView(parentView: Electron.View) {
    // no-op: not a real view
    void parentView;
  }
  public override removeThisFromParentView(parentView: Electron.View) {
    // no-op: not a real view
    void parentView;
  }
}
