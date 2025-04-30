import { debugPrint } from "@/modules/output";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getSettingValueById, onSettingsCached, settingsEmitter } from "@/saving/settings";
import { app } from "electron";
import { autoUpdater, ProgressInfo, UpdateInfo } from "electron-updater";

const SUPPORTED_PLATFORMS: NodeJS.Platform[] = [
  "win32",
  "linux"
  // TODO: Add macOS (Requires Code Signing)
  // "darwin"
];

let availableUpdate: UpdateInfo | null = null;
let downloadProgress: ProgressInfo | null = null;
let updateDownloaded: boolean = false;

export const updateEmitter = new TypedEventEmitter<{
  "status-changed": [];
}>();

// TODO: use this function
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isAutoUpdateSupported(platform: NodeJS.Platform): boolean {
  return SUPPORTED_PLATFORMS.includes(platform);
}

async function checkForUpdates() {
  const updateInfo = await autoUpdater.checkForUpdates();
  console.log("Update Info", updateInfo);
  return updateInfo;
}

function connectUpdaterListeners() {
  autoUpdater.on("update-available", (updateInfo) => {
    debugPrint("AUTO_UPDATER", "Update Available", updateInfo);
    availableUpdate = updateInfo;
    updateEmitter.emit("status-changed");
  });

  autoUpdater.on("update-not-available", (updateInfo) => {
    debugPrint("AUTO_UPDATER", "Update Not Available", updateInfo);
  });

  autoUpdater.on("download-progress", (progress) => {
    debugPrint("AUTO_UPDATER", "Download Progress", progress);
    downloadProgress = progress;
    updateEmitter.emit("status-changed");
  });

  autoUpdater.on("update-downloaded", (updateInfo) => {
    debugPrint("AUTO_UPDATER", "Update Downloaded", updateInfo);
    availableUpdate = updateInfo;
    downloadProgress = null;
    updateDownloaded = true;
    updateEmitter.emit("status-changed");
  });
}

export function getUpdateStatus() {
  return {
    availableUpdate,
    downloadProgress,
    updateDownloaded
  };
}

export function downloadUpdate() {
  if (downloadProgress) return false;
  if (updateDownloaded) return false;

  autoUpdater.downloadUpdate();
  return true;
}

export function installUpdate() {
  if (updateDownloaded) {
    autoUpdater.quitAndInstall();
    return true;
  }
  return false;
}

async function updateAutoUpdaterConfig() {
  const autoUpdate = getSettingValueById("autoUpdate") as boolean | undefined;
  autoUpdater.autoDownload = autoUpdate === true;
}

onSettingsCached().then(() => {
  // Update Auto Updater Config
  updateAutoUpdaterConfig();

  settingsEmitter.on("settings-changed", () => {
    updateAutoUpdaterConfig();
  });

  // Run after App Ready
  app.whenReady().then(() => {
    // Connect Listeners
    connectUpdaterListeners();

    // Check For Updates every 15 minutes
    checkForUpdates();
    setInterval(checkForUpdates, 1000 * 60 * 15);
  });
});
