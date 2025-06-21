import { app, BrowserWindow, Menu, MenuItem } from "electron";
import { Browser } from "@/browser/browser";
import "@/ipc/main";
import "@/settings/main";
import { hasCompletedOnboarding } from "@/saving/onboarding";
import { onboarding } from "@/onboarding/main";
import { createInitialWindow } from "@/saving/tabs";
import { TabbedBrowserWindow } from "@/browser/window";
import "@/modules/auto-update";
import "@/modules/posthog";
import "@/modules/content-blocker";
import { debugPrint } from "@/modules/output";
import { setupQuitHandler } from "@/modules/quit-handlers";

export let browser: Browser | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to check if --new-window flag is present in command line arguments
function shouldCreateNewWindow(args: string[]): boolean {
  return args.includes("--new-window");
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

function isValidOpenerUrl(url: string): boolean {
  // Check if the URL is a valid URL
  const urlObject = URL.parse(url);
  if (!urlObject) {
    return false;
  }

  const VALID_PROTOCOLS = ["http:", "https:"];
  // Check if the URL has a valid protocol
  if (!VALID_PROTOCOLS.includes(urlObject.protocol)) {
    return false;
  }

  return true;
}

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
  window.window.focus();
};

function initializeApp() {
  const gotTheLock = app.requestSingleInstanceLock();
  debugPrint("INITIALIZATION", "gotTheLock", gotTheLock);

  if (!gotTheLock) {
    return false;
  }

  // Print header
  printHeader();

  // Initialize the Browser
  browser = new Browser();
  debugPrint("INITIALIZATION", "browser object created");

  // Handle command line arguments
  const commandLine = process.argv.slice(1);
  const targetUrl = commandLine.pop();
  if (targetUrl && isValidOpenerUrl(targetUrl)) {
    // Handle the URL if it is valid
    handleOpenUrl(targetUrl);
  }

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
    if (url && isValidOpenerUrl(url)) {
      // Handle the URL if it is valid
      handleOpenUrl(url);
    }
  });
  debugPrint("INITIALIZATION", "second instance handler initialized");

  // Setup platform specific features
  if (process.platform === "win32") {
    setupWindowsUserTasks();
    debugPrint("INITIALIZATION", "setup windows user tasks");
  } else if (process.platform === "darwin") {
    setupMacOSDock(browser);
  }

  // Open onboarding / create initial window
  debugPrint("INITIALIZATION", "grabbing hasCompletedOnboarding()");
  hasCompletedOnboarding().then((completed) => {
    debugPrint("INITIALIZATION", "grabbed hasCompletedOnboarding()", completed);
    if (!completed) {
      onboarding.show();
      debugPrint("INITIALIZATION", "show onboarding window");
    } else {
      createInitialWindow();
      debugPrint("INITIALIZATION", "show browser window");
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
      return;
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

  app.on("open-url", async (_event, url) => {
    handleOpenUrl(url);
  });

  setupQuitHandler();
  return true;
}

// Start the application
const initialized = initializeApp();
if (!initialized) {
  app.quit();
}
