import { WebContents, WebContentsView } from "electron";
import { TabbedBrowserWindow } from "@/browser/window";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { BrowserEvents } from "@/browser/events";
import { Browser } from "@/browser/browser";

// Types from window.ts
export type BrowserWindowType = "normal" | "popup";

export interface BrowserWindowCreationOptions {
  window?: Electron.BrowserWindowConstructorOptions;
}

/**
 * Manages browser windows and their lifecycle
 */
export class WindowManager {
  private readonly windows: Map<number, TabbedBrowserWindow>;
  private readonly eventEmitter: TypedEventEmitter<BrowserEvents>;

  constructor(eventEmitter: TypedEventEmitter<BrowserEvents>) {
    this.windows = new Map();
    this.eventEmitter = eventEmitter;
  }

  /**
   * Creates a new browser window
   */
  public createWindow(
    browser: Browser,
    type: BrowserWindowType = "normal",
    options: BrowserWindowCreationOptions = {}
  ): TabbedBrowserWindow {
    const window = new TabbedBrowserWindow(browser, type, options);
    this.windows.set(window.id, window);

    window.on("destroy", () => {
      this.windows.delete(window.id);
      this.eventEmitter.emit("window-destroyed", window);
    });

    this.eventEmitter.emit("window-created", window);
    return window;
  }

  /**
   * Gets all windows
   */
  public getWindows(): TabbedBrowserWindow[] {
    return Array.from(this.windows.values());
  }

  /**
   * Gets the focused window
   */
  public getFocusedWindow(): TabbedBrowserWindow | undefined {
    for (const window of this.windows.values()) {
      if (window.window.isFocused()) {
        return window;
      }
    }
    return undefined;
  }

  /**
   * Gets a window by its ID
   */
  public getWindowById(windowId: number): TabbedBrowserWindow | undefined {
    return this.windows.get(windowId);
  }

  /**
   * Gets a window from WebContents
   */
  public getWindowFromWebContents(webContents: WebContents): TabbedBrowserWindow | null {
    for (const window of this.windows.values()) {
      for (const windowWebContents of window.coreWebContents) {
        if (webContents.id === windowWebContents.id) {
          return window;
        }
      }

      // Temporary solution for tabs in the window
      for (const windowWebContents of window.window.contentView.children) {
        if (windowWebContents instanceof WebContentsView && webContents.id === windowWebContents.webContents.id) {
          return window;
        }
      }
    }
    return null;
  }

  /**
   * Destroys a window
   */
  private destroyWindow(window: TabbedBrowserWindow): void {
    try {
      window.destroy();
    } catch (error) {
      console.error("Error destroying window:", error);
    } finally {
      this.windows.delete(window.id);
    }
  }

  /**
   * Destroys a window by its ID
   */
  public destroyWindowById(windowId: number): boolean {
    const window = this.windows.get(windowId);
    if (!window) {
      return false;
    }

    this.destroyWindow(window);
    return true;
  }

  /**
   * Destroys all windows
   */
  public destroyAll(): void {
    for (const window of this.windows.values()) {
      this.destroyWindow(window);
    }
  }
}
