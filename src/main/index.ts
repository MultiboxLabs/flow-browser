import { app, BrowserWindow, Menu, MenuItem } from "electron";
import { Browser } from "@/browser/browser";
import "@/ipc/main";
import "@/settings/main";
import { hasCompletedOnboarding } from "@/saving/onboarding";
import { onboarding } from "@/onboarding/main";
import { createInitialWindow } from "@/saving/tabs";
import { TabbedBrowserWindow } from "@/browser/window";

export let browser: Browser | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to check if --new-window flag is present in command line arguments
function shouldCreateNewWindow(args: string[]): boolean {
  return args.includes("--new-window");
}

function setupAutoUpdate() {
  // TODO: Implement auto update
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  app.on("second-instance", (_event, commandLine) => {
    if (!browser) return;

    if (shouldCreateNewWindow(commandLine)) {
      browser.createWindow();
    } else {
      const window = browser.getWindows()[0];
      if (window) {
        window.window.focus();
      }
    }

    const url = commandLine.pop();
    if (url) {
      handleOpenUrl(url);
    }
  });

  // Setup auto update
  setupAutoUpdate();

  // Setup platform specific features
  if (process.platform === "win32") {
    setupWindowsUserTasks();
  } else if (process.platform === "darwin") {
    setupMacOSDock(browser);
  }

  // Open onboarding / create initial window
  hasCompletedOnboarding().then((completed) => {
    if (!completed) {
      onboarding.show();
    } else {
      createInitialWindow();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      return app.quit();
    }

    // Quit app if onboarding isn't completed
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

  // Handle open links
  const handleOpenUrl = async (url: string) => {
    if (!browser) return;

    if (!app.isReady) {
      await app.whenReady();
    }

    let window: TabbedBrowserWindow | null = null;

    for (let i = 0; i < 5; i++) {
      // Check if there is a focused window
      const focusedWindow = browser.getFocusedWindow();
      if (focusedWindow) {
        window = focusedWindow;
        break;
      }

      // Check for any window
      const firstWindow = browser.getWindows()[0];
      if (firstWindow) {
        window = firstWindow;
        break;
      }

      await sleep(50);
    }

    // If no window was found after 5 attempts, create a new one
    // This is to make sure it doesn't create two windows on startup.
    if (!window) {
      window = await browser.createWindow();
    }

    const tab = await browser.tabs.createTab(window.id);
    tab.loadURL(url);
    browser.tabs.setActiveTab(tab);
  };

  app.on("open-url", async (_event, url) => {
    handleOpenUrl(url);
  });
}

// Start the application
initializeApp();
