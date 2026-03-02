import { setOnboardingCompleted, resetOnboarding } from "@/saving/onboarding";
import { ipcMain } from "electron";

ipcMain.on("onboarding:finish", () => {
  return setOnboardingCompleted();
});

ipcMain.on("onboarding:reset", () => {
  return resetOnboarding();
});
