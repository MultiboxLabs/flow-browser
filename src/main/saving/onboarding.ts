import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { onboarding } from "@/controllers/windows-controller/interfaces/onboarding";
import { SettingsDataStore } from "@/saving/settings";
import { debugPrint } from "@/modules/output";
import { app } from "electron";

const ONBOARDING_KEY = "onboarding_version_completed";
const ONBOARDING_VERSION = "v0";

/** Timeout (ms) for reading onboarding state from disk.
 *  If the DataStore is blocked (e.g. libuv thread-pool exhaustion),
 *  the caller can treat this as "not completed" and show onboarding. */
const ONBOARDING_CHECK_TIMEOUT_MS = 10_000;

let onboardingCompleted: boolean | null = null;

export async function hasCompletedOnboarding() {
  if (onboardingCompleted) return true;

  let grabbedOnboardingData: boolean = false;
  const onboardingData = await Promise.race([
    SettingsDataStore.get<string>(ONBOARDING_KEY),
    new Promise<undefined>((resolve) => {
      setTimeout(() => {
        if (!grabbedOnboardingData) {
          debugPrint("INITIALIZATION", "hasCompletedOnboarding() timed out after", ONBOARDING_CHECK_TIMEOUT_MS, "ms");
        }
        resolve(undefined);
      }, ONBOARDING_CHECK_TIMEOUT_MS);
    })
  ]);
  grabbedOnboardingData = true;

  const completed = onboardingData === ONBOARDING_VERSION;
  if (completed) onboardingCompleted = true;
  return completed;
}

export async function setOnboardingCompleted() {
  await SettingsDataStore.set(ONBOARDING_KEY, ONBOARDING_VERSION);
  onboardingCompleted = true;

  // Create the browser window BEFORE hiding the onboarding window so that
  // there is never a moment with zero open windows.  On non-macOS platforms
  // Electron fires `window-all-closed` synchronously when the last window is
  // destroyed, which calls `app.quit()` and prevents the browser window from
  // ever being created.
  if (browserWindowsController.getWindows().length === 0) {
    await browserWindowsController.create();
  }

  onboarding.hide();
}

export async function resetOnboarding() {
  await SettingsDataStore.remove(ONBOARDING_KEY);
  app.quit();
}
