import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { hasCompletedOnboarding } from "@/saving/onboarding";
import { debugPrint } from "@/modules/output";
import { createIncognitoWindow } from "@/modules/incognito/windows";
import { FLAGS } from "@/modules/flags";

/**
 * During cold start, URLs are queued until the initial window (session restore
 * or fresh window) has been created. This avoids a race where both the URL
 * handler and session-restore independently create a window, resulting in two
 * visible windows.
 *
 * While onboarding has not been completed, all incoming URLs are silently
 * discarded so no browser windows are created alongside the onboarding window.
 */
let pendingStartupUrls: { useNewWindow: boolean; url: string }[] = [];
let startupComplete = false;

export function isValidOpenerUrl(url: string): boolean {
  const urlObject = URL.parse(url);
  if (!urlObject) return false;

  const VALID_PROTOCOLS = ["http:", "https:"];
  if (!VALID_PROTOCOLS.includes(urlObject.protocol)) return false;

  return true;
}

export async function handleOpenUrl(useNewWindow: boolean, url: string) {
  const onboardingCompleted = await hasCompletedOnboarding();
  if (!onboardingCompleted) {
    debugPrint("INITIALIZATION", "discarded URL during onboarding:", url);
    return;
  }

  if (!startupComplete) {
    pendingStartupUrls.push({ useNewWindow, url });
    debugPrint("INITIALIZATION", "queued URL for after startup:", url);
    return;
  }

  await openUrlInWindow(useNewWindow, url);
}

async function openUrlInWindow(useNewWindow: boolean, url: string) {
  // Find a window to use, show + focus it
  const windows = browserWindowsController.getWindows();
  const focusedWindow = browserWindowsController.getFocusedWindow();
  const hasWindows = windows.length > 0;

  const shouldCreate = useNewWindow || !hasWindows;
  const window = shouldCreate ? await browserWindowsController.create() : focusedWindow ? focusedWindow : windows[0];

  window.show(true);

  // Create a new tab with the URL
  const tab = await tabsController.createTab(window.id, undefined, undefined, undefined, { url });
  tabsController.activateTab(tab);
}

/**
 * Called after the initial window has been created (session restore or fresh
 * window). Opens any URLs that were received during startup in the existing
 * window instead of creating new ones.
 */
export async function flushPendingUrls() {
  startupComplete = true;
  const urls = pendingStartupUrls;
  pendingStartupUrls = [];

  for (const { useNewWindow, url } of urls) {
    debugPrint("INITIALIZATION", "flushing pending URL:", url);
    await openUrlInWindow(useNewWindow, url);
  }
}

/**
 * Marks startup as complete and discards any queued URLs without opening them.
 * Used during onboarding where browser windows should not be created.
 */
export function discardPendingUrls() {
  startupComplete = true;
  pendingStartupUrls = [];
  debugPrint("INITIALIZATION", "discarded pending URLs (onboarding)");
}

export function processInitialUrl() {
  const commandLine = process.argv.slice(1);

  if (commandLine.includes("--new-incognito-window") && FLAGS.INCOGNITO_ENABLED) {
    createIncognitoWindow().catch((error) => {
      console.error("[URLs] Failed to create incognito window from initial args:", error);
    });
    debugPrint("INITIALIZATION", "initial incognito window requested");
    return;
  }

  const targetUrl = commandLine.pop();
  if (targetUrl && isValidOpenerUrl(targetUrl)) {
    handleOpenUrl(false, targetUrl);
    debugPrint("INITIALIZATION", "initial URL handled");
  }
}
