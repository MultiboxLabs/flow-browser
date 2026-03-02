import { app } from "electron";
import { debugPrint } from "@/modules/output";
import { hasCompletedOnboarding } from "@/saving/onboarding";
import { onboarding } from "@/controllers/windows-controller/interfaces/onboarding";
import { restoreSession as createInitialWindow } from "@/saving/tabs/restore";
import { flushPendingUrls, discardPendingUrls } from "@/app/urls";

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
        // Discard any URLs queued during startup -- no browser windows should
        // be created while onboarding is in progress. Any URLs arriving after
        // this point are also discarded by handleOpenUrl via hasCompletedOnboarding().
        discardPendingUrls();
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
      discardPendingUrls();
    }
  });
}
