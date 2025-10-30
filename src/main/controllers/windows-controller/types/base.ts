import { type WindowType } from "@/controllers/windows-controller";
import { sendMessageToListenersWithWebContents } from "@/ipc/listeners-manager";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { BrowserWindow, WebContentsView, type WebContents } from "electron";

export interface BaseWindowEvents {
  loaded: [];
  destroyed: [];
}

export type BaseWindowOptions = {
  showAfterLoad?: boolean;
  deferShowUntilAfterLoad?: boolean;
};

export class BaseWindow<
  WindowEvents extends BaseWindowEvents = BaseWindowEvents
> extends TypedEventEmitter<WindowEvents> {
  public type: WindowType;
  public readonly browserWindow: BrowserWindow;
  private options: BaseWindowOptions;
  private finishedLoading: boolean;

  public destroyed: boolean = false;

  constructor(type: WindowType, browserWindow: BrowserWindow, options: BaseWindowOptions = {}) {
    super();

    this.type = type;
    this.browserWindow = browserWindow;
    this.options = options;
    this.finishedLoading = false;

    browserWindow.webContents.on("did-finish-load", () => {
      this.finishedLoading = true;
      this.emit("loaded");

      if (options.showAfterLoad) {
        this.show();
      }
    });

    this._setupWindow();
  }

  get id() {
    return this.browserWindow.id;
  }

  public getAllWebContents() {
    const webContents: WebContents[] = [];

    const browserWindow = this.browserWindow;
    const contentView = browserWindow.contentView;

    // Find the window's main webContents
    const windowWebContents = browserWindow.webContents;
    webContents.push(windowWebContents);

    // Find the window's other webContents
    const windowViews = contentView.children;
    for (const view of windowViews) {
      if (view instanceof WebContentsView) {
        webContents.push(view.webContents);
      }
    }

    return webContents;
  }

  public showImmediately(focus: boolean = true) {
    this.browserWindow.show();
    if (focus) {
      this.browserWindow.focus();
    }
  }

  public async show(focus: boolean = true) {
    if (this.options.deferShowUntilAfterLoad && !this.finishedLoading) {
      await this.waitUntil("loaded");
    }
    return this.showImmediately(focus);
  }

  public hide() {
    this.browserWindow.hide();
  }

  public isVisible() {
    return this.browserWindow.isVisible();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public sendMessage(channel: string, ...args: any[]) {
    const foundWebContents = this.getAllWebContents();
    return sendMessageToListenersWithWebContents(foundWebContents, channel, ...args);
  }

  private _setupWindow() {
    const win = this.browserWindow;
    win.on("closed", () => {
      this.destroy();
    });
  }

  public close() {
    this.browserWindow.close();
  }

  public destroy(force: boolean = false) {
    if (this.destroyed) {
      return false;
    }

    // Cleanup the window
    const browserWindow = this.browserWindow;
    if (!browserWindow.isDestroyed()) {
      if (force) {
        browserWindow.destroy();
      } else {
        browserWindow.close();
      }
    }

    // Emit the closed event
    this.destroyed = true;
    this.emit("destroyed");
    this.destroyEmitter();
    return true;
  }
}
