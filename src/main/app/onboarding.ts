import { app } from "electron";
import { debugPrint } from "@/modules/output";
import { hasCompletedOnboarding } from "@/saving/onboarding";
import { onboarding } from "@/controllers/windows-controller/interfaces/onboarding";
import { restoreSession as createInitialWindow } from "@/saving/tabs/restore";
import { flushPendingUrls } from "@/app/urls";

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
        // Mark startup complete so any subsequent open-url events are handled
        // directly (pending URLs, if any, will create their own browser window).
        await flushPendingUrls();
      } else {
        await createInitialWindow();
        debugPrint("INITIALIZATION", "show browser window");
        // Now that the restored window(s) exist, open any URLs that were
        // received during startup as new tabs in the restored window instead
        // of creating additional windows.
        await flushPendingUrls();
      }
    } catch (error) {
      debugPrint("INITIALIZATION", "hasCompletedOnboarding() failed, falling back to onboarding:", error);
      onboarding.show();
      await flushPendingUrls();
    }
  });
}
