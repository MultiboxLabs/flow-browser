import { BrowserWindow, Rectangle, WebContents, WebContentsView } from "electron";
import { debugPrint } from "@/modules/output";
import { clamp } from "@/modules/utils";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { sendMessageToListenersWithWebContents } from "@/ipc/listeners-manager";
import type { OmniboxOpenIn, OmniboxOpenState } from "~/flow/interfaces/browser/omnibox";

const omniboxes = new Map<BrowserWindow, Omnibox>();
const OMNIBOX_URL = "flow-internal://omnibox/";

type QueryParams = { [key: string]: string };

const OMNIBOX_OPEN_DEVTOOLS = true;

export class Omnibox {
  public view: WebContentsView;
  public webContents: WebContents;

  private window: BrowserWindow;
  private bounds: Electron.Rectangle | null = null;
  private ignoreBlurEvents: boolean = false;
  private blurIgnoreTimeout: NodeJS.Timeout | null = null;
  private openState: OmniboxOpenState = {
    currentInput: "",
    openIn: "current",
    sequence: 0
  };

  private isDestroyed: boolean = false;

  constructor(parentWindow: BrowserWindow) {
    debugPrint("OMNIBOX", `Creating new omnibox for window ${parentWindow.id}`);
    const onmiboxView = new WebContentsView({
      webPreferences: {
        transparent: true
      }
    });
    const onmiboxWC = onmiboxView.webContents;

    if (OMNIBOX_OPEN_DEVTOOLS) {
      onmiboxWC.openDevTools({ mode: "detach" });
    }

    onmiboxView.setBorderRadius(13);

    // on focus lost, hide omnibox
    onmiboxWC.on("blur", () => {
      // Required cuz it (somehow) sends the blur event as soon as you opened the omnibox
      // Without this, the omnibox would be hidden as soon as you opened it.
      // This behaviour isn't on macOS.
      if (this.ignoreBlurEvents) {
        debugPrint("OMNIBOX", "Ignoring blur event");
        return;
      }

      debugPrint("OMNIBOX", "WebContents blur event received");
      this.maybeHide();
    });
    onmiboxWC.on("did-finish-load", () => {
      debugPrint("OMNIBOX", "Omnibox interface finished loading");
      this.emitOpenState();
    });
    parentWindow.on("resize", () => {
      debugPrint("OMNIBOX", "Parent window resize event received");
      this.updateBounds();
    });

    setTimeout(() => {
      this.loadInterface();
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

  loadInterface() {
    this.assertNotDestroyed();

    debugPrint("OMNIBOX", "Ensuring omnibox interface is loaded");
    const onmiboxWC = this.webContents;
    if (onmiboxWC.getURL() !== OMNIBOX_URL) {
      debugPrint("OMNIBOX", `Loading omnibox URL: ${OMNIBOX_URL}`);
      onmiboxWC.loadURL(OMNIBOX_URL);
    }
  }

  private normalizeOpenIn(value: string | undefined): OmniboxOpenIn {
    return value === "new_tab" ? "new_tab" : "current";
  }

  private suppressBlurEventsTemporarily(durationMs: number = 150) {
    this.ignoreBlurEvents = true;

    if (this.blurIgnoreTimeout) {
      clearTimeout(this.blurIgnoreTimeout);
    }

    this.blurIgnoreTimeout = setTimeout(() => {
      this.ignoreBlurEvents = false;
      this.blurIgnoreTimeout = null;
    }, durationMs);
  }

  private emitOpenState() {
    if (this.webContents.isDestroyed()) {
      return;
    }

    sendMessageToListenersWithWebContents([this.webContents], "omnibox:on-state-changed", this.openState);
  }

  getOpenState() {
    this.assertNotDestroyed();
    return this.openState;
  }

  setOpenState(params: QueryParams | null) {
    this.assertNotDestroyed();

    this.openState = {
      currentInput: params?.currentInput ?? "",
      openIn: this.normalizeOpenIn(params?.openIn),
      sequence: this.openState.sequence + 1
    };
    debugPrint("OMNIBOX", `Updating open state: ${JSON.stringify(this.openState)}`);
    this.emitOpenState();
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
      const omniboxHeight = Math.min(335, windowBounds.height);
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
    this.loadInterface();
    // Hide omnibox if it is already visible
    this.hide();

    // Show UI
    this.view.setVisible(true);

    const tryFocus = () => {
      if (this.view.getVisible()) {
        debugPrint("OMNIBOX", "Attempting to focus omnibox");
        this.window.focus();
        this.webContents.focus();
      }
    };

    this.suppressBlurEventsTemporarily();

    tryFocus();
    setTimeout(tryFocus, 100);
  }

  refocus() {
    this.assertNotDestroyed();

    if (this.isVisible()) {
      debugPrint("OMNIBOX", "Refocusing omnibox");
      this.suppressBlurEventsTemporarily();
      this.window.focus();
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

    // All conditions passed, hide omnibox
    debugPrint("OMNIBOX", "All conditions passed, hiding omnibox");
    this.hide();
  }

  _setBounds(bounds: Electron.Rectangle | null) {
    debugPrint("OMNIBOX", `Setting bounds to: ${JSON.stringify(bounds)}`);
    this.bounds = bounds;
    this.updateBounds();
  }

  destroy() {
    this.assertNotDestroyed();

    if (this.blurIgnoreTimeout) {
      clearTimeout(this.blurIgnoreTimeout);
      this.blurIgnoreTimeout = null;
    }

    this.isDestroyed = true;
    this.webContents.close();
  }

  // Extra //
  setBounds(bounds: Electron.Rectangle | null) {
    const parentWindow = this.window;
    if (bounds) {
      const windowBounds = parentWindow.getBounds();

      const newBounds: Electron.Rectangle = {
        x: Math.min(bounds.x, windowBounds.width - bounds.width),
        y: Math.min(bounds.y, windowBounds.height - bounds.height),
        width: bounds.width,
        height: bounds.height
      };

      this._setBounds(newBounds);
    } else {
      this._setBounds(null);
    }
  }
}
