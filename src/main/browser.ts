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
import electronDragClick from "electron-drag-click";

// Start tab persistence flush interval (writes dirty tabs to disk every ~2s)
tabPersistenceManager.start();

// Setup electron drag click
electronDragClick();

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
