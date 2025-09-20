import { app } from "electron";
import type { Browser } from "@/browser/browser";
import type { TabbedBrowserWindow } from "@/browser/window";
import { debugPrint } from "@/modules/output";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAppToBeReady() {
  if (!app.isReady) {
    await app.whenReady();
  }
}

export function isValidOpenerUrl(url: string): boolean {
  const urlObject = URL.parse(url);
  if (!urlObject) return false;

  const VALID_PROTOCOLS = ["http:", "https:"];
  if (!VALID_PROTOCOLS.includes(urlObject.protocol)) return false;

  return true;
}

export async function handleOpenUrl(browser: Browser, url: string) {
  await waitForAppToBeReady();

  let window: TabbedBrowserWindow | null = null;

  for (let i = 0; i < 5; i++) {
    const focusedWindow = browser.getFocusedWindow();
    if (focusedWindow) {
      window = focusedWindow;
      break;
    }

    const firstWindow = browser.getWindows()[0];
    if (firstWindow) {
      window = firstWindow;
      break;
    }

    await sleep(50);
  }

  if (!window) {
    window = await browser.createWindow();
  }

  const tab = await browser.tabs.createTab(window.id);
  tab.loadURL(url);
  browser.tabs.setActiveTab(tab);
  window.window.focus();
}

export function processInitialUrl(browser: Browser) {
  const commandLine = process.argv.slice(1);
  const targetUrl = commandLine.pop();
  if (targetUrl && isValidOpenerUrl(targetUrl)) {
    handleOpenUrl(browser, targetUrl);
    debugPrint("INITIALIZATION", "initial URL handled");
  }
}

