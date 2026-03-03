import { BrowserWindow, Rectangle, WebContents, WebContentsView } from "electron";
import { debugPrint } from "@/modules/output";
import { clamp } from "@/modules/utils";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { OmniboxShowOptions } from "~/flow/interfaces/browser/omnibox";

const omniboxes = new Map<BrowserWindow, Omnibox>();

export class Omnibox {
  public view: WebContentsView;
  public webContents: WebContents;

  private window: BrowserWindow;
  private bounds: Electron.Rectangle | null = null;
  private ignoreBlurEvents: boolean = false;
  private isDestroyed: boolean = false;

  /** Resolves once the omnibox page has finished its initial load. */
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;
  private isReady: boolean = false;

  constructor(parentWindow: BrowserWindow) {
    debugPrint("OMNIBOX", `Creating new omnibox for window ${parentWindow.id}`);

    this.readyPromise = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });

    const omniboxView = new WebContentsView({
      webPreferences: {
        transparent: true
      }
    });
    const omniboxWC = omniboxView.webContents;

    omniboxView.setBorderRadius(13);

    // On focus lost, hide omnibox
    omniboxWC.on("blur", () => {
      // Required because it (somehow) sends the blur event as soon as you opened the omnibox.
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

    // Preload the omnibox page once and track readiness
    omniboxWC.once("did-finish-load", () => {
      debugPrint("OMNIBOX", "Initial page load complete — omnibox is ready");
      this.isReady = true;
      this.resolveReady();
    });

    setTimeout(() => {
      this.loadInterface();
      this.updateBounds();
      this.hide();
    }, 0);

    omniboxes.set(parentWindow, this);

    this.view = omniboxView;
    this.webContents = omniboxWC;
    this.window = parentWindow;
  }

  private assertNotDestroyed() {
    if (this.isDestroyed) {
      throw new Error("Omnibox has been destroyed");
    }
  }

  /**
   * Loads the omnibox page. Called once during construction.
   * After this, the page stays alive and is communicated with via IPC.
   */
  private loadInterface() {
    this.assertNotDestroyed();
    debugPrint("OMNIBOX", "Loading omnibox interface (one-time)");
    this.webContents.loadURL("flow-internal://omnibox/");
  }

  /**
   * Sends a show event to the omnibox renderer with the given options.
   * If the page hasn't loaded yet, the event is queued until it's ready.
   */
  private sendShowEvent(options: OmniboxShowOptions) {
    const params = {
      currentInput: options.currentInput,
      openIn: options.openIn
    };

    if (this.isReady) {
      debugPrint("OMNIBOX", `Sending show event with params: ${JSON.stringify(params)}`);
      this.webContents.send("omnibox:show-event", params);
    } else {
      debugPrint("OMNIBOX", "Page not ready — queuing show event");
      this.readyPromise.then(() => {
        debugPrint("OMNIBOX", `Sending queued show event with params: ${JSON.stringify(params)}`);
        this.webContents.send("omnibox:show-event", params);
      });
    }
  }

  /**
   * Sends a hide event to the omnibox renderer so it can clean up.
   */
  private sendHideEvent() {
    if (this.isReady) {
      debugPrint("OMNIBOX", "Sending hide event to renderer");
      this.webContents.send("omnibox:hide-event");
    }
  }

  private updateBounds() {
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

  /**
   * Shows the omnibox with the given options.
   * Handles bounds, sends params to the renderer via IPC, and focuses.
   */
  show(options?: OmniboxShowOptions) {
    this.assertNotDestroyed();
    debugPrint("OMNIBOX", `Showing omnibox with options: ${JSON.stringify(options)}`);

    // Hide if already visible (resets state)
    this.hide();

    // Set bounds
    if (options?.bounds) {
      const windowBounds = this.window.getBounds();
      const newBounds: Electron.Rectangle = {
        x: Math.min(options.bounds.x, windowBounds.width - options.bounds.width),
        y: Math.min(options.bounds.y, windowBounds.height - options.bounds.height),
        width: options.bounds.width,
        height: options.bounds.height
      };
      this.bounds = newBounds;
    } else {
      this.bounds = null;
    }
    this.updateBounds();

    // Send params to renderer via IPC (no page reload)
    this.sendShowEvent(options ?? {});

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

    // Notify the renderer so it can stop in-flight queries
    this.sendHideEvent();

    if (omniboxWasFocused) {
      // Focus the parent window instead
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

    // The user may need to access a program outside of the app.
    // Closing the popup would then add inconvenience.
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

  destroy() {
    this.assertNotDestroyed();

    this.isDestroyed = true;
    this.webContents.close();
  }
}
