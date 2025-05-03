import { registerAppForCurrentUserOnWindows } from "@/modules/default-browser-windows";
import { exec } from "child_process";
import { app } from "electron";

export function isDefaultBrowser() {
  if (process.platform === "darwin") {
    const httpIsDefault = app.isDefaultProtocolClient("http");
    const httpsIsDefault = app.isDefaultProtocolClient("https");

    return httpIsDefault && httpsIsDefault;
  }

  return false;
}

export function setDefaultBrowser() {
  app.setAsDefaultProtocolClient("http");
  app.setAsDefaultProtocolClient("https");

  return new Promise((resolve) => {
    if (process.platform === "linux" || process.platform.includes("bsd")) {
      exec("xdg-settings set default-web-browser vieb.desktop", (err) => {
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
