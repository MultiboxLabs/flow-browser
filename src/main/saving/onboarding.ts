import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { onboarding } from "@/controllers/windows-controller/interfaces/onboarding";
import { SettingsDataStore } from "@/saving/settings";
import { app } from "electron";

const ONBOARDING_KEY = "onboarding_version_completed";
const ONBOARDING_VERSION = "v0";

let onboardingCompleted: boolean | null = null;

export async function hasCompletedOnboarding() {
  if (onboardingCompleted) return true;

  const onboardingData = await SettingsDataStore.get<string>(ONBOARDING_KEY);
  const completed = onboardingData === ONBOARDING_VERSION;
  if (completed) onboardingCompleted = true;
  return completed;
}

export async function setOnboardingCompleted() {
  await SettingsDataStore.set(ONBOARDING_KEY, ONBOARDING_VERSION);
  onboardingCompleted = true;
  onboarding.hide();

  if (browserWindowsController.getWindows().length === 0) {
    browserWindowsController.create();
  }
}

export async function resetOnboarding() {
  await SettingsDataStore.remove(ONBOARDING_KEY);
  app.quit();
}
