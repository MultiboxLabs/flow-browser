import { app } from "electron";
import { debugPrint } from "@/modules/output";
import { hasCompletedOnboarding } from "@/saving/onboarding";
import { onboarding } from "@/controllers/windows-controller/interfaces/onboarding";
import { restoreSession as createInitialWindow } from "@/saving/tabs/restore";

export function runOnboardingOrInitialWindow() {
  debugPrint("INITIALIZATION", "waiting for app.whenReady() before onboarding check");
  app.whenReady().then(async () => {
    debugPrint("INITIALIZATION", "grabbing hasCompletedOnboarding()");
    try {
      const completed = await hasCompletedOnboarding();
      debugPrint("INITIALIZATION", "grabbed hasCompletedOnboarding()", completed);
      if (!completed) {
        onboarding.show();
        debugPrint("INITIALIZATION", "show onboarding window");
      } else {
        createInitialWindow();
        debugPrint("INITIALIZATION", "show browser window");
      }
    } catch (error) {
      debugPrint("INITIALIZATION", "hasCompletedOnboarding() failed, falling back to onboarding:", error);
      onboarding.show();
    }
  });
}
