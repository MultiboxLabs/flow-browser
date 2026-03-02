import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { debugPrint } from "@/modules/output";

/**
 * During cold start, URLs are queued until the initial window (session restore
 * or fresh window) has been created. This avoids a race where both the URL
 * handler and session-restore independently create a window, resulting in two
 * visible windows.
 *
 * While onboarding is active, all incoming URLs are silently discarded so no
 * browser windows are created alongside the onboarding window.
 */
let pendingStartupUrls: { useNewWindow: boolean; url: string }[] = [];
let startupComplete = false;
let onboardingActive = false;

export function isValidOpenerUrl(url: string): boolean {
  const urlObject = URL.parse(url);
  if (!urlObject) return false;

  const VALID_PROTOCOLS = ["http:", "https:"];
  if (!VALID_PROTOCOLS.includes(urlObject.protocol)) return false;

  return true;
}

export async function handleOpenUrl(useNewWindow: boolean, url: string) {
  if (onboardingActive) {
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
  tabsController.setActiveTab(tab);
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
 * Marks startup as complete, enables onboarding mode, and discards any queued
 * URLs without opening them. All subsequent URLs are also silently dropped
 * until {@link setOnboardingComplete} is called.
 */
export function discardPendingUrls() {
  startupComplete = true;
  onboardingActive = true;
  pendingStartupUrls = [];
  debugPrint("INITIALIZATION", "discarded pending URLs (onboarding active)");
}

/**
 * Clears the onboarding guard so that future open-url / continue-activity
 * events are handled normally again.
 */
export function setOnboardingComplete() {
  onboardingActive = false;
  debugPrint("INITIALIZATION", "onboarding complete, URL handling re-enabled");
}

export function processInitialUrl() {
  const commandLine = process.argv.slice(1);
  const targetUrl = commandLine.pop();
  if (targetUrl && isValidOpenerUrl(targetUrl)) {
    handleOpenUrl(false, targetUrl);
    debugPrint("INITIALIZATION", "initial URL handled");
  }
}
