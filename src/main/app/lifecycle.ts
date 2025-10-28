import { app, BrowserWindow } from "electron";
import { handleOpenUrl } from "@/app/urls";
import { hasCompletedOnboarding } from "@/saving/onboarding";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";

export function setupAppLifecycle() {
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
      return;
    }

    hasCompletedOnboarding().then((completed) => {
      if (!completed) {
        app.quit();
      }
    });
  });

  app.whenReady().then(() => {
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        browserWindowsController.create();
      }
    });
  });

  app.on("open-url", async (_event, url) => {
    handleOpenUrl(false, url);
  });
}
