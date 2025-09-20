import "@/ipc/main";
import "@/settings/main";
import "@/modules/auto-update";
import "@/modules/posthog";
import "@/modules/content-blocker";
import { debugPrint } from "@/modules/output";
import { Browser } from "@/browser/browser";
import { app, BrowserWindow, Menu, MenuItem } from "electron";
import { TabbedBrowserWindow } from "@/browser/window";
import { setupQuitHandler } from "@/modules/quit-handlers";
import { hasCompletedOnboarding } from "@/saving/onboarding";
import { createInitialWindow } from "@/saving/tabs";
import { onboarding } from "@/onboarding/main";

// Define internal functions
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function waitForAppToBeReady() {
  if (!app.isReady) {
    await app.whenReady();
  }
}

function shouldCreateNewWindow(args: string[]): boolean {
  return args.includes("--new-window");
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

async function handleOpenUrl(url: string) {
  if (!browser) return;

  await waitForAppToBeReady();

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
}

// Initialize the browser
export const browser: Browser = new Browser();
debugPrint("INITIALIZATION", "browser object created");

// Handle initial URL (runs asynchronously)
const commandLine = process.argv.slice(1);
const targetUrl = commandLine.pop();
if (targetUrl && isValidOpenerUrl(targetUrl)) {
  // Handle the URL if it is valid
  handleOpenUrl(targetUrl);
  debugPrint("INITIALIZATION", "initial URL handled");
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
