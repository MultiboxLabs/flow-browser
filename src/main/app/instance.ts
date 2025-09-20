import { app } from "electron";
import type { Browser } from "@/browser/browser";
import { handleOpenUrl, isValidOpenerUrl } from "@/app/urls";
import { debugPrint } from "@/modules/output";

function shouldCreateNewWindow(args: string[]): boolean {
  return args.includes("--new-window");
}

export function setupSecondInstanceHandling(browser: Browser) {
  app.on("second-instance", (_event, commandLine) => {
    if (shouldCreateNewWindow(commandLine)) {
      browser.createWindow();
    } else {
      const window = browser.getWindows()[0];
      if (window) {
        window.window.focus();
      }
    }

    const url = commandLine.pop();
    if (url && isValidOpenerUrl(url)) {
      handleOpenUrl(browser, url);
    }
  });

  debugPrint("INITIALIZATION", "second instance handler initialized");
}
