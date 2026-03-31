import type { ElectronChromeExtensions } from "electron-chrome-extensions";

const DISPATCH_TIMEOUT_MS = 10000;
const DISPATCH_INTERVAL_MS = 1000 / 60;
const MAX_DISPATCH_TRIES = Math.ceil(DISPATCH_TIMEOUT_MS / DISPATCH_INTERVAL_MS);
// This is usually called when an extension is installed, which means it may take a while to fully load
// Before it is fully loaded, it may error with 'Failed to start service worker'
// That's why we keep dispatching the event until it succeeds, or until tries run out
export async function dispatchExtensionInstalledEvent(
  extensions: ElectronChromeExtensions,
  extensionId: string,
  reason: "install" | "update"
) {
  let tries = 0;
  while (tries < MAX_DISPATCH_TRIES) {
    tries++;
    const success = await extensions.dispatchRuntimeInstalled(extensionId, { reason });
    if (success) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, DISPATCH_INTERVAL_MS));
  }
  return false;
}
