import { BrowserWindow, Rectangle, WebContents, WebContentsView } from "electron";
import { debugPrint } from "@/modules/output";
import { clamp } from "@/modules/utils";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";

const omniboxes = new Map<BrowserWindow, Omnibox>();

type QueryParams = { [key: string]: string };

/** Parameters sent to the renderer when showing the omnibox. */
interface OmniboxShowParams {
  currentInput: string | null;
  openIn: "current" | "new_tab";
}

export class Omnibox {
  public view: WebContentsView;
  public webContents: WebContents;

  private window: BrowserWindow;
  private bounds: Electron.Rectangle | null = null;
  private ignoreBlurEvents: boolean = false;

  private isDestroyed: boolean = false;

  /** Whether the initial load of the omnibox URL has completed. */
  private initialLoadComplete: boolean = false;
  /** Whether the renderer has registered its IPC listeners and can receive show events. */
  private rendererReady: boolean = false;
  /** Most recent show payload queued while waiting for renderer readiness. */
  private pendingShowParams: OmniboxShowParams | null = null;

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
    parentWindow.on("resize", () => {
      debugPrint("OMNIBOX", "Parent window resize event received");
      this.updateBounds();
    });

    onmiboxWC.on("did-start-loading", () => {
      this.rendererReady = false;
    });

    // Track when the initial load finishes
    onmiboxWC.on("did-finish-load", () => {
      if (!this.initialLoadComplete) {
        this.initialLoadComplete = true;
        debugPrint("OMNIBOX", "Initial load complete");
      }
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

  /**
   * Load the omnibox interface URL. Only used for initial load.
   * After the first load, the renderer stays alive and receives IPC messages.
   */
  loadInterface(params: QueryParams | null) {
    this.assertNotDestroyed();

    // If the omnibox renderer is already loaded, send params via IPC instead of reloading
    if (this.initialLoadComplete) {
      if (!this.rendererReady) {
        debugPrint("OMNIBOX", "Renderer not ready yet, queueing show event until listener registration");
        this.pendingShowParams = {
          currentInput: params?.currentInput ?? null,
          openIn: (params?.openIn as "current" | "new_tab") ?? "new_tab"
        };
        return;
      }

      debugPrint("OMNIBOX", "Omnibox already loaded, sending show event via IPC instead of reloading");
      const showParams: OmniboxShowParams = {
        currentInput: params?.currentInput ?? null,
        openIn: (params?.openIn as "current" | "new_tab") ?? "new_tab"
      };
      this.webContents.send("omnibox:do-show", showParams);
      return;
    }

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

  /**
   * Send a show event to the already-loaded omnibox renderer via IPC.
   * This is the preferred method after the initial load — no reload, no flicker.
   */
  sendShowEvent(params: OmniboxShowParams) {
    this.assertNotDestroyed();

    if (!this.initialLoadComplete) {
      debugPrint("OMNIBOX", "Initial load not complete, routing show event through loadInterface");
      const queryParams: QueryParams = { openIn: params.openIn };
      if (params.currentInput !== null) {
        queryParams.currentInput = params.currentInput;
      }
      this.loadInterface(queryParams);
      return;
    }

    if (!this.rendererReady) {
      debugPrint("OMNIBOX", "Renderer not ready yet, queueing show event");
      this.pendingShowParams = params;
      return;
    }

    debugPrint("OMNIBOX", `Sending show event with params: ${JSON.stringify(params)}`);
    this.webContents.send("omnibox:do-show", params);
  }

  markRendererReady() {
    this.assertNotDestroyed();
    this.rendererReady = true;

    if (!this.pendingShowParams) {
      return;
    }

    const params = this.pendingShowParams;
    this.pendingShowParams = null;
    debugPrint("OMNIBOX", "Renderer ready, flushing queued show event");
    this.webContents.send("omnibox:do-show", params);
  }

  /**
   * Send a hide event to the renderer so it can reset its state.
   */
  sendHideEvent() {
    this.assertNotDestroyed();
    debugPrint("OMNIBOX", "Sending hide event to renderer");
    this.webContents.send("omnibox:do-hide");
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
    // Hide omnibox if it is already visible (safe: hide() no longer sends IPC)
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

    this.ignoreBlurEvents = true;

    tryFocus();
    setTimeout(tryFocus, 100);
    setTimeout(() => {
      this.ignoreBlurEvents = false;
    }, 150);
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

    // Do NOT send a hide IPC event here. The native view visibility
    // (view.setVisible) is the sole mechanism for main-process hides.
    // Sending hide IPC caused a race condition: blur events during show()
    // would trigger maybeHide() → hide() → sendHideEvent(), undoing the
    // prior sendShowEvent() and leaving the renderer with isVisible=false.
    // The renderer handles its own state for user-initiated hides (Escape,
    // match selection) and the show handler always resets state on next open.

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
