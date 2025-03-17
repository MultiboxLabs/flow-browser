import { app } from "electron";
import { Browser } from "./browser/main";

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  const browser = new Browser();

  app.on("second-instance", (_event, _commandLine, _workingDirectory, _additionalData) => {
    // Someone tried to run a second instance, we should focus our window.
    const window = browser.getWindows()[0];
    if (window) {
      window.getBrowserWindow().focus();
    }
  });
}
