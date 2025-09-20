import { app, BrowserWindow } from "electron";
import type { Browser } from "@/browser/browser";
import { handleOpenUrl } from "@/app/urls";
import { hasCompletedOnboarding } from "@/saving/onboarding";

export function setupAppLifecycle(browser: Browser) {
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
        browser?.createWindow();
      }
    });
  });

  app.on("open-url", async (_event, url) => {
    handleOpenUrl(browser, url);
  });
}

