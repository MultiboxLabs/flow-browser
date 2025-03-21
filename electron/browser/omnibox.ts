import { BrowserWindow, ipcMain, WebContents, WebContentsView } from "electron";

const omniboxes = new Map<BrowserWindow, Omnibox>();

type QueryParams = { [key: string]: string };

export class Omnibox {
  private view: WebContentsView;
  private webContents: WebContents;
  private window: BrowserWindow;
  private extensionId: string;
  private keepOnTopInterval: NodeJS.Timeout | null = null;
  private bounds: Electron.Rectangle | null = null;

  constructor(parentWindow: BrowserWindow, extensionId: string) {
    const onmiboxView = new WebContentsView();
    const onmiboxWC = onmiboxView.webContents;

    onmiboxView.setBorderRadius(13);

    // on focus lost, hide omnibox
    onmiboxWC.on("blur", () => {
      this.hide();
    });
    parentWindow.on("resize", () => {
      this.updateBounds();
    });

    // on window close, clear keep on top interval
    parentWindow.on("close", () => {
      this.clearKeepOnTopInterval();
    });
    onmiboxWC.on("destroyed", () => {
      this.clearKeepOnTopInterval();
    });

    setTimeout(() => {
      this.loadInterface(null);
      this.updateBounds();
      this.hide();
    }, 0);

    omniboxes.set(parentWindow, this);

    this.view = onmiboxView;
    this.webContents = onmiboxWC;
    this.window = parentWindow;
    this.extensionId = extensionId;
  }

  loadInterface(params: QueryParams | null) {
    const onmiboxWC = this.webContents;
    const extensionId = this.extensionId;

    const url = new URL(`chrome-extension://${extensionId}/omnibox/index.html`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const urlString = url.toString();
    if (onmiboxWC.getURL() !== urlString) {
      onmiboxWC.loadURL(urlString);
    } else {
      onmiboxWC.reload();
    }
  }

  clearKeepOnTopInterval() {
    if (this.keepOnTopInterval) {
      clearInterval(this.keepOnTopInterval);
      this.keepOnTopInterval = null;
    }
  }

  updateBounds() {
    if (this.bounds) {
      this.view.setBounds(this.bounds);
    } else {
      const windowBounds = this.window.getBounds();

      const omniboxWidth = 750;
      const omniboxHeight = 350;
      const omniboxX = windowBounds.width / 2 - omniboxWidth / 2;
      const omniboxY = windowBounds.height / 2 - omniboxHeight / 2;

      this.view.setBounds({
        x: omniboxX,
        y: omniboxY,
        width: omniboxWidth,
        height: omniboxHeight
      });
    }
  }

  isVisible() {
    return this.view.getVisible();
  }

  show() {
    // Hide omnibox if it is already visible
    this.hide();

    // Keep on top
    this.keepOnTopInterval = setInterval(() => {
      this.window.contentView.addChildView(this.view);
    }, 100);

    // Show UI
    this.view.setVisible(true);

    const tryFocus = () => {
      this.window.focus();
      this.webContents.focus();
    };

    tryFocus();
    setTimeout(tryFocus, 100);
  }

  hide() {
    this.clearKeepOnTopInterval();
    this.view.setVisible(false);
  }

  setBounds(bounds: Electron.Rectangle | null) {
    this.bounds = bounds;
    this.updateBounds();
  }
}

export function getNewTabMode(): "omnibox" | "tab" {
  return "omnibox";
}

export function setOmniboxBounds(parentWindow: BrowserWindow, bounds: Electron.Rectangle) {
  const omnibox = omniboxes.get(parentWindow);
  if (omnibox) {
    omnibox.setBounds(bounds);
  }
}

export function loadOmnibox(parentWindow: BrowserWindow, params: QueryParams | null) {
  const omnibox = omniboxes.get(parentWindow);
  if (omnibox) {
    omnibox.loadInterface(params);
  }
}

export function showOmnibox(parentWindow: BrowserWindow) {
  const omnibox = omniboxes.get(parentWindow);
  if (omnibox) {
    omnibox.show();
  }
}

export function hideOmnibox(parentWindow: BrowserWindow) {
  const omnibox = omniboxes.get(parentWindow);
  if (omnibox) {
    omnibox.hide();
  }
}

export function isOmniboxOpen(parentWindow: BrowserWindow) {
  const omnibox = omniboxes.get(parentWindow);
  return omnibox ? omnibox.isVisible() : false;
}

// IPC Handlers //
ipcMain.on("show-omnibox", (event, bounds: Electron.Rectangle | null, params: { [key: string]: string } | null) => {
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  setOmniboxBounds(parentWindow, bounds);
  loadOmnibox(parentWindow, params);
  showOmnibox(parentWindow);
});

ipcMain.on("hide-omnibox", (event) => {
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  hideOmnibox(parentWindow);
});
