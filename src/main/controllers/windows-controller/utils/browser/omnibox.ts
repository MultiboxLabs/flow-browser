import { BrowserWindow, Rectangle, WebContents, WebContentsView } from "electron";
import { debugPrint } from "@/modules/output";
import { browser } from "@/browser";
import { clamp } from "@/modules/utils";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";

const omniboxes = new Map<BrowserWindow, Omnibox>();

type QueryParams = { [key: string]: string };

export class Omnibox {
  public view: WebContentsView;
  public webContents: WebContents;

  private window: BrowserWindow;
  private bounds: Electron.Rectangle | null = null;

  private isDestroyed: boolean = false;

  constructor(parentWindow: BrowserWindow) {
    debugPrint("OMNIBOX", `Creating new omnibox for window ${parentWindow.id}`);
    const onmiboxView = new WebContentsView({
      webPreferences: {
        transparent: true
      }
    });
    const onmiboxWC = onmiboxView.webContents;

    onmiboxView.setBorderRadius(13);

    // on focus lost, hide omnibox
    onmiboxWC.on("blur", () => {
      debugPrint("OMNIBOX", "WebContents blur event received");
      this.maybeHide();
    });
    parentWindow.on("resize", () => {
      debugPrint("OMNIBOX", "Parent window resize event received");
      this.updateBounds();
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
  }

  private assertNotDestroyed() {
    if (this.isDestroyed) {
      throw new Error("Omnibox has been destroyed");
    }
  }

  loadInterface(params: QueryParams | null) {
    this.assertNotDestroyed();

    debugPrint("OMNIBOX", `Loading interface with params: ${JSON.stringify(params)}`);
    const onmiboxWC = this.webContents;

    const url = new URL("flow-internal://omnibox/");
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const urlString = url.toString();
    if (onmiboxWC.getURL() !== urlString) {
      debugPrint("OMNIBOX", `Loading new URL: ${urlString}`);
      onmiboxWC.loadURL(urlString);
    } else {
      debugPrint("OMNIBOX", "Reloading current URL");
      onmiboxWC.reload();
    }
  }

  updateBounds() {
    this.assertNotDestroyed();

    if (this.bounds) {
      debugPrint("OMNIBOX", `Updating bounds to: ${JSON.stringify(this.bounds)}`);

      const windowBounds = this.window.getBounds();

      const newX = clamp(this.bounds.x, 0, windowBounds.width);
      const newY = clamp(this.bounds.y, 0, windowBounds.height);
      const newWidth = clamp(this.bounds.width, 0, windowBounds.width - newX);
      const newHeight = clamp(this.bounds.height, 0, windowBounds.height - newY);

      const newBounds: Rectangle = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      };

      this.view.setBounds(newBounds);
    } else {
      const windowBounds = this.window.getBounds();

      const omniboxWidth = Math.min(750, windowBounds.width);
      const omniboxHeight = Math.min(350, windowBounds.height);
      const omniboxX = windowBounds.width / 2 - omniboxWidth / 2;
      const omniboxY = windowBounds.height / 2 - omniboxHeight / 2;

      const newBounds: Rectangle = {
        x: omniboxX,
        y: omniboxY,
        width: omniboxWidth,
        height: omniboxHeight
      };
      debugPrint("OMNIBOX", `Calculating new bounds: ${JSON.stringify(newBounds)}`);
      this.view.setBounds(newBounds);
    }
  }

  isVisible() {
    this.assertNotDestroyed();

    const visible = this.view.getVisible();
    debugPrint("OMNIBOX", `Checking visibility: ${visible}`);
    return visible;
  }

  show() {
    this.assertNotDestroyed();

    debugPrint("OMNIBOX", "Showing omnibox");
    // Hide omnibox if it is already visible
    this.hide();

    // Show UI
    this.view.setVisible(true);

    const tryFocus = () => {
      debugPrint("OMNIBOX", "Attempting to focus omnibox");
      this.window.focus();
      this.webContents.focus();
    };

    tryFocus();
    setTimeout(tryFocus, 100);
  }

  refocus() {
    this.assertNotDestroyed();

    if (this.isVisible()) {
      debugPrint("OMNIBOX", "Refocusing omnibox");
      this.webContents.focus();
      return true;
    }
    return false;
  }

  hide() {
    this.assertNotDestroyed();

    const omniboxWasFocused = this.webContents.isFocused();

    debugPrint("OMNIBOX", "Hiding omnibox");
    this.view.setVisible(false);

    if (omniboxWasFocused) {
      // Focuses the parent window instead
      this.window.webContents.focus();
    }
  }

  maybeHide() {
    if (this.window.isDestroyed()) {
      return;
    }

    this.assertNotDestroyed();

    // Keep open if webContents is being inspected
    if (!this.window.isDestroyed() && this.webContents.isDevToolsOpened()) {
      debugPrint("OMNIBOX", "preventing close due to DevTools being open");
      return;
    }

    // The user may need to access a
    // program outside of the app. Closing the popup would then add
    // inconvenience.
    if (browser) {
      const hasFocus = browserWindowsController.getWindows().some((win) => {
        if (win.destroyed) {
          return false;
        }
        return win.browserWindow.isFocused();
      });
      if (!hasFocus) {
        debugPrint("OMNIBOX", "preventing close due to focus residing outside of the app");
        return;
      }
    }

    // All conditions passed, hide omnibox
    debugPrint("OMNIBOX", "All conditions passed, hiding omnibox");
    this.hide();
  }

  setBounds(bounds: Electron.Rectangle | null) {
    debugPrint("OMNIBOX", `Setting bounds to: ${JSON.stringify(bounds)}`);
    this.bounds = bounds;
    this.updateBounds();
  }

  destroy() {
    this.assertNotDestroyed();

    this.isDestroyed = true;
    this.webContents.close();
  }
}

export function setOmniboxBounds(parentWindow: BrowserWindow, bounds: Electron.Rectangle | null) {
  const omnibox = omniboxes.get(parentWindow);
  if (omnibox) {
    if (bounds) {
      const windowBounds = parentWindow.getBounds();

      const newBounds: Electron.Rectangle = {
        x: Math.min(bounds.x, windowBounds.width - bounds.width),
        y: Math.min(bounds.y, windowBounds.height - bounds.height),
        width: bounds.width,
        height: bounds.height
      };

      omnibox.setBounds(newBounds);
    } else {
      omnibox.setBounds(null);
    }
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
