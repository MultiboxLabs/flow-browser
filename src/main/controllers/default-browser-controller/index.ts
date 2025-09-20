import { app } from "electron";
import { registerAppForCurrentUserOnWindows } from "./windows-handler";
import { exec } from "child_process";

class DefaultBrowserController {
  public isDefaultBrowser(): boolean {
    if (process.platform === "win32") {
      return false;
    }

    const httpIsDefault = app.isDefaultProtocolClient("http");
    const httpsIsDefault = app.isDefaultProtocolClient("https");

    return httpIsDefault && httpsIsDefault;
  }

  public setDefaultBrowser(): Promise<boolean> {
    app.setAsDefaultProtocolClient("http");
    app.setAsDefaultProtocolClient("https");

    return new Promise((resolve) => {
      if (process.platform === "linux" || process.platform.includes("bsd")) {
        exec("xdg-settings set default-web-browser flow.desktop", (err) => {
          if (err?.message) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
        return;
      } else if (process.platform === "win32") {
        registerAppForCurrentUserOnWindows().then(resolve);
        return;
      } else if (process.platform === "darwin") {
        // Electron API should be enough to show a popup for default app request
        resolve(true);
        return;
      }

      // If we don't know how to set the default browser, return false
      resolve(false);
    });
  }
}

export const defaultBrowserController = new DefaultBrowserController();
