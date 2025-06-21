import { app } from "electron";
import { canQuit } from "./handlers/can-quit";
import { beforeQuit } from "./handlers/before-quit";

let beforeQuitHandlerState: "idle" | "running" | "completed" = "idle";

export function setupQuitHandler() {
  app.on("before-quit", (event) => {
    if (beforeQuitHandlerState === "completed") {
      // Let the app quit normally
      return;
    }

    // Prevent the app from quitting if the handler is not completed
    event.preventDefault();

    // If the handler is idle and the app can quit, run it
    if (beforeQuitHandlerState === "idle" && canQuit()) {
      beforeQuitHandlerState = "running";

      const handleBeforeQuit = async () => {
        const result = await beforeQuit();
        if (result) {
          beforeQuitHandlerState = "completed";
          app.quit();
        }
      };
      handleBeforeQuit();
    }
  });
}
