import { app, ipcMain, Menu, MenuItem } from "electron";
import { Browser } from "./browser/main";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";

if (require("electron-squirrel-startup")) app.quit();

// Function to check if --new-window flag is present in command line arguments
function shouldCreateNewWindow(args: string[]): boolean {
  return args.includes("--new-window");
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // Initial Header //

  if (!app.isPackaged) {
    // Hide all the build outputs
    console.log("\n".repeat(75));
  }

  console.log("\x1b[34m%s\x1b[0m", "--- Flow Browser ---");

  if (app.isPackaged) {
    console.log("\x1b[32m%s\x1b[0m", `Production Build (${app.getVersion()})`);
  } else {
    console.log("\x1b[31m%s\x1b[0m", `Development Build (${app.getVersion()})`);
  }

  console.log("");

  // Initialize the Browser //
  const browser = new Browser();

  // Handle Second Instance //
  app.on("second-instance", (_event, commandLine, _workingDirectory, _additionalData) => {
    // Check if the second instance was launched with --new-window flag
    if (shouldCreateNewWindow(commandLine)) {
      // Create a new window instead of focusing the existing one
      browser.createWindow();
    } else {
      // Default behavior: focus the first window
      const window = browser.getWindows()[0];
      if (window) {
        window.getBrowserWindow().focus();
      }
    }
  });

  // IPC Handlers for actions not exposed through the Chrome Extension API //
  ipcMain.on("stop-loading-tab", (event, tabId: number) => {
    const webContents = event.sender;
    const window = browser.getWindowFromWebContents(webContents);
    if (!window) return;

    const tab = window.tabs.get(tabId);
    if (!tab) return;

    tab.webContents.stop();
  });

  ipcMain.handle("get-tab-navigation-status", async (event, tabId: number) => {
    const webContents = event.sender;
    const window = browser.getWindowFromWebContents(webContents);
    if (!window) return null;

    const tab = window.tabs.get(tabId);
    if (!tab) return null;

    const tabWebContents = tab.webContents;
    const navigationHistory = tabWebContents.navigationHistory;

    return {
      navigationHistory: navigationHistory.getAllEntries(),
      activeIndex: navigationHistory.getActiveIndex(),
      canGoBack: navigationHistory.canGoBack(),
      canGoForward: navigationHistory.canGoForward()
    };
  });

  ipcMain.on("go-to-navigation-entry", (event, tabId: number, index: number) => {
    const webContents = event.sender;
    const window = browser.getWindowFromWebContents(webContents);
    if (!window) return;

    const tab = window.tabs.get(tabId);
    if (!tab) return;

    return tab.webContents.navigationHistory.goToIndex(index);
  });

  // Auto Update //
  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: "multiboxlabs/flow-browser"
    },
    notifyUser: true
  });

  // Set Toolbar Options //
  if (process.platform === "win32") {
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
  } else if (process.platform === "darwin") {
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
      // TODO: Incognito Window
      // Not implemented yet
      new MenuItem({
        label: "New Incognito Window",
        enabled: false
      })
    );

    app.whenReady().then(() => {
      app.dock.setMenu(dockMenu);
    });
  }
}
