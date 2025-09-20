import { app, Menu, MenuItem } from "electron";
import type { Browser } from "@/browser/browser";
import { debugPrint } from "@/modules/output";

function setupWindowsUserTasks() {
  app.setUserTasks([
    {
      program: process.execPath,
      arguments: "--new-window",
      iconPath: process.execPath,
      iconIndex: 0,
      title: "New Window",
      description: "Create a new window"
    }
  ]);
}

function setupMacOSDock(browser: Browser) {
  const dockMenu = new Menu();

  dockMenu.append(
    new MenuItem({
      label: "New Window",
      click: () => {
        browser.createWindow();
      }
    })
  );

  dockMenu.append(
    new MenuItem({
      label: "New Incognito Window",
      enabled: false
    })
  );

  app.whenReady().then(() => {
    if ("dock" in app) {
      app.dock?.setMenu(dockMenu);
    }
  });
}

export function setupPlatformIntegration(browser: Browser) {
  if (process.platform === "win32") {
    setupWindowsUserTasks();
    debugPrint("INITIALIZATION", "setup windows user tasks finished");
  } else if (process.platform === "darwin") {
    setupMacOSDock(browser);
    debugPrint("INITIALIZATION", "setup macOS dock finished");
  }
}
