import { setOnboardingCompleted, resetOnboarding } from "@/saving/onboarding";
import { setOnboardingComplete } from "@/app/urls";
import { ipcMain } from "electron";

ipcMain.on("onboarding:finish", () => {
  setOnboardingComplete();
  return setOnboardingCompleted();
});

ipcMain.on("onboarding:reset", () => {
  return resetOnboarding();
});
