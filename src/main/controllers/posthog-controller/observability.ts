import { posthogController } from "./index";
import { tabsController } from "@/controllers/tabs-controller";
import { windowsController } from "@/controllers/windows-controller";
import { spacesController } from "@/controllers/spaces-controller";
import { profilesController } from "@/controllers/profiles-controller";
import { autoUpdateController } from "@/controllers/auto-update-controller";
import { settingsEmitter } from "@/saving/settings";
import { app } from "electron";
import { Tab } from "@/controllers/tabs-controller/tab";
import { appStartTimestamp } from "@/app/startup";

function setupTabEvents(): void {
  const tabLoadStartTimes = new Map<number, number>();

  tabsController.on("tab-created", (tab: Tab) => {
    posthogController.captureEvent("tab-created", {
      tabCount: tabsController.tabs.size
    });

    const webContents = tab.webContents;
    if (webContents) {
      webContents.on("did-start-loading", () => {
        tabLoadStartTimes.set(tab.id, Date.now());
      });

      webContents.on("did-finish-load", () => {
        const startTime = tabLoadStartTimes.get(tab.id);
        if (startTime) {
          const loadDurationMs = Date.now() - startTime;
          tabLoadStartTimes.delete(tab.id);
          posthogController.captureEvent("tab-load-finished", {
            loadDurationMs
          });
        }
      });

      webContents.on("did-fail-load", (_event, errorCode, _errorDescription, _validatedURL, isMainFrame) => {
        if (isMainFrame) {
          tabLoadStartTimes.delete(tab.id);

          if (errorCode === -3) return;

          posthogController.captureEvent("tab-load-failed", {
            errorCode
          });
        }
      });
    }
  });

  tabsController.on("tab-removed", (tab) => {
    tabLoadStartTimes.delete(tab.id);
    posthogController.captureEvent("tab-closed", {
      tabCount: tabsController.tabs.size
    });
  });

  let lastTabSwitchTime = 0;
  const TAB_SWITCH_THROTTLE_MS = 500;

  tabsController.on("active-tab-changed", () => {
    const now = Date.now();
    if (now - lastTabSwitchTime < TAB_SWITCH_THROTTLE_MS) return;
    lastTabSwitchTime = now;
    posthogController.captureEvent("tab-switched");
  });
}

function setupWindowEvents(): void {
  windowsController.on("window-added", (_id, window) => {
    posthogController.captureEvent("window-created", {
      windowType: window.type
    });
  });

  windowsController.on("window-removed", (_id, window) => {
    posthogController.captureEvent("window-closed", {
      windowType: window.type
    });
  });
}

function setupSpaceEvents(): void {
  spacesController.on("space-created", () => {
    posthogController.captureEvent("space-created");
  });

  spacesController.on("space-deleted", () => {
    posthogController.captureEvent("space-deleted");
  });
}

function setupProfileEvents(): void {
  profilesController.on("profile-created", () => {
    posthogController.captureEvent("profile-created");
  });

  profilesController.on("profile-deleted", () => {
    posthogController.captureEvent("profile-deleted");
  });
}

function setupUpdateEvents(): void {
  let reportedAvailableVersion: string | null = null;
  let reportedDownloadedVersion: string | null = null;

  autoUpdateController.on("status-changed", () => {
    const status = autoUpdateController.getUpdateStatus();

    if (
      status.availableUpdate &&
      !status.downloadProgress &&
      !status.updateDownloaded &&
      status.availableUpdate.version !== reportedAvailableVersion
    ) {
      reportedAvailableVersion = status.availableUpdate.version;
      posthogController.captureEvent("update-available", {
        version: status.availableUpdate.version
      });
    }

    if (
      status.updateDownloaded &&
      status.availableUpdate &&
      status.availableUpdate.version !== reportedDownloadedVersion
    ) {
      reportedDownloadedVersion = status.availableUpdate.version;
      posthogController.captureEvent("update-downloaded", {
        version: status.availableUpdate.version
      });
    }
  });
}

function setupSettingsEvents(): void {
  settingsEmitter.on("settings-changed", () => {
    posthogController.captureEvent("setting-changed");
  });
}

function setupAppReadyEvent(): void {
  app.whenReady().then(() => {
    const startupMs = Date.now() - appStartTimestamp;
    posthogController.captureEvent("app-ready", { startupMs });
  });
}

export function initializeObservability(): void {
  setupAppReadyEvent();
  setupTabEvents();
  setupWindowEvents();
  setupSpaceEvents();
  setupProfileEvents();
  setupUpdateEvents();
  setupSettingsEvents();
}
