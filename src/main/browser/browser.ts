import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { BrowserEvents } from "@/browser/events";
import { settings } from "@/controllers/windows-controller/interfaces/settings";
import { onboarding } from "@/controllers/windows-controller/interfaces/onboarding";
import "@/modules/extensions/main";

/**
 * Main Browser controller that coordinates browser components
 *
 * The Browser is responsible for:
 * - Coordinating window and profile management
 * - Handling lifecycle events
 * - Providing a unified API for browser operations
 */
export class Browser extends TypedEventEmitter<BrowserEvents> {
  private _isDestroyed: boolean = false;

  /**
   * Creates a new Browser instance
   */
  constructor() {
    super();
  }

  /**
   * Checks if the browser is destroyed
   */
  public checkIsDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Cleans up and destroys the browser
   */
  public destroy(): void {
    if (this._isDestroyed) {
      throw new Error("Browser already destroyed!");
    }

    try {
      // Mark as destroyed and emit event
      this._isDestroyed = true;
      this.emit("destroy");
    } catch (error) {
      console.error("Error during browser destruction:", error);
    } finally {
      // Always destroy the emitter
      this.destroyEmitter();
    }
  }

  /**
   * Sends a message to all core WebContents
   * TODO: remove this placeholder function and replace with new one
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public sendMessageToCoreWebContents(channel: string, ...args: any[]) {
    // for (const window of this.getWindows()) {
    //   window.sendMessageToCoreWebContents(channel, ...args);
    // }
    settings.sendMessage(channel, ...args);
    onboarding.sendMessage(channel, ...args);
  }
}
