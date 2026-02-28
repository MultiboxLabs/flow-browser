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
import { tabPersistenceManager } from "@/saving/tabs";
import { initCursorEdgeMonitor } from "@/controllers/windows-controller/utils/cursor-edge-monitor";
import { pinnedTabsController } from "@/controllers/pinned-tabs-controller";

// Start tab persistence flush interval (writes dirty tabs to disk every ~2s)
tabPersistenceManager.start();

// Load pinned tabs from database into memory
// Note: loadAll() uses synchronous better-sqlite3 internally, so the work
// completes immediately despite the async signature. No await needed.
pinnedTabsController.loadAll();

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
