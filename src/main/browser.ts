import "@/controllers";
import "@/ipc/main";
import "@/modules/content-blocker";
import { debugPrint } from "@/modules/output";
import { Browser } from "@/browser/browser";
import { setupPlatformIntegration } from "@/app/platform";
import { processInitialUrl } from "@/app/urls";
import { setupSecondInstanceHandling } from "@/app/instance";
import { runOnboardingOrInitialWindow } from "@/app/onboarding";
import { setupAppLifecycle } from "@/app/lifecycle";

// Initialize the browser
export const browser: Browser = new Browser();
debugPrint("INITIALIZATION", "browser object created");

// Handle initial URL (runs asynchronously)
processInitialUrl(browser);

// Setup second instance handler
setupSecondInstanceHandling(browser);

// Setup platform specific features
setupPlatformIntegration();

// Open onboarding / create initial window
runOnboardingOrInitialWindow();

// App lifecycle events
setupAppLifecycle(browser);
