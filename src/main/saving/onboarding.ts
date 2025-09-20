import { browser } from "@/browser";
import { onboarding } from "@/onboarding/main";
import { SettingsDataStore } from "@/saving/settings";
import { app } from "electron";

const ONBOARDING_KEY = "onboarding_version_completed";
const ONBOARDING_VERSION = "v0";

export async function hasCompletedOnboarding() {
  const onboardingData = await SettingsDataStore.get<string>(ONBOARDING_KEY);
  return onboardingData === ONBOARDING_VERSION;
}

export async function setOnboardingCompleted() {
  await SettingsDataStore.set(ONBOARDING_KEY, ONBOARDING_VERSION);
  onboarding.hide();

  if (browser?.getWindows().length === 0) {
    browser?.createWindow();
  }
}

export async function resetOnboarding() {
  await SettingsDataStore.remove(ONBOARDING_KEY);
  app.quit();
}
