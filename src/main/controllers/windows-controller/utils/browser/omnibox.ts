import { BrowserWindow, Rectangle, WebContents, WebContentsView } from "electron";
import { debugPrint } from "@/modules/output";
import { clamp } from "@/modules/utils";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { sendMessageToListenersWithWebContents } from "@/ipc/listeners-manager";
import type {
  OmniboxOpenIn,
  OmniboxOpenParams,
  OmniboxOpenState,
  OmniboxShadowPadding
} from "~/flow/interfaces/browser/omnibox";

const omniboxes = new Map<BrowserWindow, Omnibox>();
const OMNIBOX_URL = "flow-internal://omnibox/";
const DEFAULT_OMNIBOX_WIDTH = 750;
const DEFAULT_OMNIBOX_HEIGHT = 335;
const OMNIBOX_SHADOW_PADDING = 30;

const DEFAULT_SHADOW_PADDING: OmniboxShadowPadding = {
  top: OMNIBOX_SHADOW_PADDING,
  right: OMNIBOX_SHADOW_PADDING,
  bottom: OMNIBOX_SHADOW_PADDING,
  left: OMNIBOX_SHADOW_PADDING
};

type PaddedBounds = {
  bounds: Rectangle;
  shadowPadding: OmniboxShadowPadding;
};

const OMNIBOX_OPEN_DEVTOOLS = false;

function normalizeBounds(bounds: Electron.Rectangle, windowBounds: Rectangle): Rectangle {
  const width = clamp(Math.round(bounds.width), 0, windowBounds.width);
  const height = clamp(Math.round(bounds.height), 0, windowBounds.height);
  const x = clamp(Math.round(bounds.x), 0, Math.max(0, windowBounds.width - width));
  const y = clamp(Math.round(bounds.y), 0, Math.max(0, windowBounds.height - height));

  return {
    x,
    y,
    width,
    height
  };
}

function addShadowPadding(bounds: Electron.Rectangle, windowBounds: Rectangle): PaddedBounds {
  const left = clamp(bounds.x - OMNIBOX_SHADOW_PADDING, 0, windowBounds.width);
  const top = clamp(bounds.y - OMNIBOX_SHADOW_PADDING, 0, windowBounds.height);
  const right = clamp(bounds.x + bounds.width + OMNIBOX_SHADOW_PADDING, left, windowBounds.width);
  const bottom = clamp(bounds.y + bounds.height + OMNIBOX_SHADOW_PADDING, top, windowBounds.height);

  return {
    bounds: {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    },
    shadowPadding: {
      top: bounds.y - top,
      right: right - (bounds.x + bounds.width),
      bottom: bottom - (bounds.y + bounds.height),
      left: bounds.x - left
    }
  };
}

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
    sequence: 0,
    shadowPadding: DEFAULT_SHADOW_PADDING
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

  private setShadowPadding(shadowPadding: OmniboxShadowPadding) {
    const current = this.openState.shadowPadding;
    if (
      current.top === shadowPadding.top &&
      current.right === shadowPadding.right &&
      current.bottom === shadowPadding.bottom &&
      current.left === shadowPadding.left
    ) {
      return;
    }

    this.openState = {
      ...this.openState,
      shadowPadding
    };
    debugPrint("OMNIBOX", `Updating shadow padding: ${JSON.stringify(shadowPadding)}`);
    this.emitOpenState();
  }

  setOpenState(params: OmniboxOpenParams | null) {
    this.assertNotDestroyed();

    this.openState = {
      currentInput: params?.currentInput ?? "",
      openIn: this.normalizeOpenIn(params?.openIn),
      sequence: this.openState.sequence + 1,
      shadowPadding: this.openState.shadowPadding
    };
    debugPrint("OMNIBOX", `Updating open state: ${JSON.stringify(this.openState)}`);
    this.emitOpenState();
  }

  updateBounds() {
    this.assertNotDestroyed();

    if (this.bounds) {
      debugPrint("OMNIBOX", `Updating bounds to: ${JSON.stringify(this.bounds)}`);

      const windowBounds = this.window.getBounds();

      const contentBounds = normalizeBounds(this.bounds, windowBounds);
      const paddedBounds = addShadowPadding(contentBounds, windowBounds);

      this.setShadowPadding(paddedBounds.shadowPadding);
      this.view.setBounds(paddedBounds.bounds);
    } else {
      const windowBounds = this.window.getBounds();

      const availableWidth = Math.max(0, windowBounds.width - OMNIBOX_SHADOW_PADDING * 2);
      const availableHeight = Math.max(0, windowBounds.height - OMNIBOX_SHADOW_PADDING * 2);
      const omniboxWidth = Math.min(DEFAULT_OMNIBOX_WIDTH, availableWidth);
      const omniboxHeight = Math.min(DEFAULT_OMNIBOX_HEIGHT, availableHeight);
      const omniboxX = Math.round(windowBounds.width / 2 - omniboxWidth / 2);
      const omniboxY = Math.round(windowBounds.height / 2 - omniboxHeight / 2);
      const paddedBounds = addShadowPadding(
        {
          x: omniboxX,
          y: omniboxY,
          width: omniboxWidth,
          height: omniboxHeight
        },
        windowBounds
      );
      debugPrint("OMNIBOX", `Calculating new bounds: ${JSON.stringify(paddedBounds.bounds)}`);
      this.setShadowPadding(paddedBounds.shadowPadding);
      this.view.setBounds(paddedBounds.bounds);
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
    if (bounds) {
      this._setBounds(bounds);
    } else {
      this._setBounds(null);
    }
  }
}
