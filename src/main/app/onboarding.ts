import { debugPrint } from "@/modules/output";
import { hasCompletedOnboarding } from "@/saving/onboarding";
import { onboarding } from "@/controllers/windows-controller/interfaces/onboarding";
import { createInitialWindow } from "@/saving/tabs";

export function runOnboardingOrInitialWindow() {
  debugPrint("INITIALIZATION", "grabbing hasCompletedOnboarding()");
  hasCompletedOnboarding().then((completed) => {
    debugPrint("INITIALIZATION", "grabbed hasCompletedOnboarding()", completed);
    if (!completed) {
      onboarding.show();
      debugPrint("INITIALIZATION", "show onboarding window");
    } else {
      createInitialWindow();
      debugPrint("INITIALIZATION", "show browser window");
    }
  });
}
