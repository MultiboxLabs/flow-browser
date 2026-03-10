import { app, Menu, MenuItem } from "electron";
import { debugPrint } from "@/modules/output";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { hasCompletedOnboarding } from "@/saving/onboarding";

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

function setupMacOSDock() {
  const dockMenu = new Menu();

  dockMenu.append(
    new MenuItem({
      label: "New Window",
      click: async () => {
        const completed = await hasCompletedOnboarding();
        if (completed) {
          browserWindowsController.create();
        }
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

export function setupPlatformIntegration() {
  if (process.platform === "win32") {
    setupWindowsUserTasks();
    debugPrint("INITIALIZATION", "setup windows user tasks finished");
  } else if (process.platform === "darwin") {
    setupMacOSDock();
    debugPrint("INITIALIZATION", "setup macOS dock finished");
  }
}
