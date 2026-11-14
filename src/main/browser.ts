/**
 * Main entrypoint after conditions met in index.ts
 */

// Import everything
import "@/controllers";
import "@/ipc";
import "@/modules/content-blocker";
import "@/modules/extensions/main";
import { setupPlatformIntegration } from "@/app/platform";
import { processInitialUrl } from "@/app/urls";
import { setupSecondInstanceHandling } from "@/app/instance";
import { runOnboardingOrInitialWindow } from "@/app/onboarding";
import { setupAppLifecycle } from "@/app/lifecycle";
import { initCursorEdgeMonitor } from "@/controllers/windows-controller/utils/cursor-edge-monitor";
import { cleanupStaleEphemeralProfiles } from "@/controllers/profiles-controller/ephemeral";
import { setupBasicAuthHandler } from "@/app/basic-auth";
import { initializeTabService } from "@/services/tab-service";

async function bootstrapBrowser() {
  await cleanupStaleEphemeralProfiles().catch((error) => {
    console.error("Failed to cleanup stale ephemeral profiles:", error);
  });

  // Initialize Tab Service v2 (registers IPC handlers, starts persistence flush, loads pinned tabs)
  initializeTabService();

  // Start cursor edge monitor (detects pointer near window edges for floating sidebar)
  initCursorEdgeMonitor();

  // Handle initial URL (runs asynchronously)
  processInitialUrl();

  // Setup second instance handler
  setupSecondInstanceHandling();

  // Setup platform specific features
  setupPlatformIntegration();

  // Open onboarding / create initial window
  runOnboardingOrInitialWindow();

  // App lifecycle events
  setupAppLifecycle();

  // Handle app.on("login") events (basic auth)
  setupBasicAuthHandler();
}

void bootstrapBrowser();
