// This controller executes quit handlers before letting the app quit.

import { app } from "electron";
import { canQuit } from "./handlers/can-quit";
import { beforeQuit } from "./handlers/before-quit";

type BeforeQuitHandlerState = "idle" | "running" | "completed";

class QuitController {
  public beforeQuitHandlerState: BeforeQuitHandlerState;

  constructor() {
    this.beforeQuitHandlerState = "idle";
    this._handleBeforeQuit();
  }

  /**
   * Returns true if the app is in the process of quitting.
   * Used to prevent tabs from being added to "recently closed" during quit.
   */
  get isQuitting(): boolean {
    return this.beforeQuitHandlerState !== "idle";
  }

  private _handleBeforeQuit() {
    app.on("before-quit", (event) => {
      if (this.beforeQuitHandlerState === "completed") {
        // Let the app quit normally
        return;
      }

      // Prevent the app from quitting if the handler is not completed
      event.preventDefault();

      // If the handler is idle and the app can quit, run it
      if (this.beforeQuitHandlerState === "idle" && canQuit()) {
        this.beforeQuitHandlerState = "running";

        const handleBeforeQuit = async () => {
          const result = await beforeQuit();
          if (result) {
            this.beforeQuitHandlerState = "completed";
            app.quit();
          } else {
            this.beforeQuitHandlerState = "idle";
          }
        };
        handleBeforeQuit();
      }
    });
  }
}

export const quitController = new QuitController();
