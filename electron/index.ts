import { app, ipcMain, Menu, MenuItem } from "electron";
import { Browser } from "@/browser/browser";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";

export let browser: Browser | null = null;

// Function to check if --new-window flag is present in command line arguments
function shouldCreateNewWindow(args: string[]): boolean {
  return args.includes("--new-window");
}

function setupAutoUpdate() {
  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: "multiboxlabs/flow-browser"
    },
    notifyUser: true
  });
}

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

function setupIPCHandlers(browser: Browser) {
  ipcMain.on("stop-loading-tab", (event, tabId: number) => {
    const webContents = event.sender;
    const window = browser.getWindowFromWebContents(webContents);
    if (!window) return;

    const tab = window.tabs.get(tabId);
    if (!tab) return;

    tab.webContents?.stop();
  });

  ipcMain.handle("get-tab-navigation-status", async (event, tabId: number) => {
    const webContents = event.sender;
    const window = browser.getWindowFromWebContents(webContents);
    if (!window) return null;

    const tab = window.tabs.get(tabId);
    if (!tab) return null;

    const tabWebContents = tab.webContents;
    const navigationHistory = tabWebContents?.navigationHistory;
    if (!navigationHistory) return null;

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

    return tab.webContents?.navigationHistory?.goToIndex(index);
  });
}

function printHeader() {
  if (!app.isPackaged) {
    console.log("\n".repeat(75));
  }

  console.log("\x1b[34m%s\x1b[0m", "--- Flow Browser ---");

  if (app.isPackaged) {
    console.log("\x1b[32m%s\x1b[0m", `Production Build (${app.getVersion()})`);
  } else {
    console.log("\x1b[31m%s\x1b[0m", `Development Build (${app.getVersion()})`);
  }

  console.log("");
}

function initializeApp() {
  if (require("electron-squirrel-startup")) {
    app.quit();
    return;
  }

  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
    return;
  }

  // Print header
  printHeader();

  // Initialize the Browser
  browser = new Browser();

  // Setup second instance handler
  app.on("second-instance", (_event, commandLine, _workingDirectory, _additionalData) => {
    if (!browser) return;

    if (shouldCreateNewWindow(commandLine)) {
      browser.createWindow();
    } else {
      const window = browser.getWindows()[0];
      if (window) {
        window.getBrowserWindow().focus();
      }
    }
  });

  // Setup IPC handlers
  setupIPCHandlers(browser);

  // Setup auto update
  setupAutoUpdate();

  // Setup platform specific features
  if (process.platform === "win32") {
    setupWindowsUserTasks();
  } else if (process.platform === "darwin") {
    setupMacOSDock(browser);
  }
}

// Start the application
initializeApp();
