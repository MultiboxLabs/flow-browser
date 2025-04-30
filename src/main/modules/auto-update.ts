import { fireUpdateStatusChanged } from "@/ipc/app/updates";
import { debugPrint } from "@/modules/output";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getSettingValueById, onSettingsCached, settingsEmitter } from "@/saving/settings";
import { app } from "electron";
import { autoUpdater, ProgressInfo, UpdateInfo, UpdateCheckResult } from "electron-updater";
import { UpdateStatus } from "~/types/updates";

// MOCK DATA //
type MockUpdateData = {
  version: `${number}.${number}.${number}`;
  isSupported: boolean;
  dataPerInterval: number; // Bytes per interval
  transportInterval: number; // Milliseconds
  fileSize: number; // Bytes
  timeForUpdateCheck: number; // Milliseconds
};

const MOCK_DATA_ENABLED = false;

const MOCK_DATA: MockUpdateData = {
  version: "1.0.1", // Example: Ensure this is different from current app version for testing
  isSupported: true,
  dataPerInterval: 100 * 1024, // 100 KB per interval
  transportInterval: 50, // 50 ms interval
  fileSize: 10 * 1024 * 1024, // 10 MB
  timeForUpdateCheck: 500 // 500 milliseconds
};
// END MOCK DATA //

const SUPPORTED_PLATFORMS: NodeJS.Platform[] = [
  "win32",
  "linux"
  // TODO: Add macOS (Requires Code Signing)
  // "darwin"
];

let availableUpdate: UpdateInfo | null = null;
let downloadProgress: ProgressInfo | null = null;
let updateDownloaded: boolean = false;
let mockDownloadIntervalId: NodeJS.Timeout | null = null;
let mockBytesDownloaded: number = 0;

export const updateEmitter = new TypedEventEmitter<{
  "status-changed": [];
}>();

updateEmitter.on("status-changed", () => {
  fireUpdateStatusChanged(getUpdateStatus());
});

export function isAutoUpdateSupported(platform: NodeJS.Platform): boolean {
  if (MOCK_DATA_ENABLED) return MOCK_DATA.isSupported;

  return SUPPORTED_PLATFORMS.includes(platform);
}

export async function checkForUpdates(): Promise<UpdateCheckResult | null> {
  if (MOCK_DATA_ENABLED) {
    debugPrint("AUTO_UPDATER", "[MOCK] Checking for updates");

    // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, MOCK_DATA.timeForUpdateCheck));

    // Simulate finding an update based on mock data
    const mockUpdateInfo: UpdateInfo = {
      version: MOCK_DATA.version,
      files: [{ url: "mock.zip", size: MOCK_DATA.fileSize, sha512: "mock-sha512-zip" }],
      path: "mock.zip", // Path might not be relevant for mock, but required by type
      sha512: "mock-sha512", // Required by type
      releaseDate: new Date().toISOString() // Required by type
      // Add other fields required by UpdateInfo if necessary, e.g., releaseName, releaseNotes
    };
    availableUpdate = mockUpdateInfo;
    updateEmitter.emit("status-changed");
    debugPrint("AUTO_UPDATER", "[MOCK] Update Available", mockUpdateInfo);
    return Promise.resolve({
      isUpdateAvailable: true,
      updateInfo: mockUpdateInfo,
      versionInfo: mockUpdateInfo
    });
  }

  const result: UpdateCheckResult | null = await autoUpdater.checkForUpdates();
  return result;
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

export function getUpdateStatus(): UpdateStatus {
  return {
    availableUpdate,
    downloadProgress,
    updateDownloaded
  };
}

export function downloadUpdate(): boolean {
  if (MOCK_DATA_ENABLED) {
    if (downloadProgress || updateDownloaded || !availableUpdate) {
      debugPrint(
        "AUTO_UPDATER",
        "[MOCK] Download not started (already in progress, downloaded, or no update available)"
      );
      return false;
    }

    debugPrint("AUTO_UPDATER", "[MOCK] Starting download simulation");
    mockBytesDownloaded = 0;
    downloadProgress = {
      // Initial progress state
      bytesPerSecond: 0,
      percent: 0,
      total: MOCK_DATA.fileSize,
      transferred: 0,
      delta: 0 // Add delta field
    };
    updateEmitter.emit("status-changed"); // Notify UI that download started

    mockDownloadIntervalId = setInterval(() => {
      mockBytesDownloaded += MOCK_DATA.dataPerInterval;
      mockBytesDownloaded = Math.min(mockBytesDownloaded, MOCK_DATA.fileSize);

      const percent = (mockBytesDownloaded / MOCK_DATA.fileSize) * 100;
      // Approximate bytesPerSecond based on interval data transfer
      const bytesPerSecond = MOCK_DATA.dataPerInterval / (MOCK_DATA.transportInterval / 1000);

      downloadProgress = {
        bytesPerSecond,
        percent,
        total: MOCK_DATA.fileSize,
        transferred: mockBytesDownloaded,
        delta: MOCK_DATA.dataPerInterval // Add delta field
      };
      debugPrint("AUTO_UPDATER", "[MOCK] Download Progress", downloadProgress);
      updateEmitter.emit("status-changed");

      if (mockBytesDownloaded >= MOCK_DATA.fileSize) {
        if (mockDownloadIntervalId) {
          clearInterval(mockDownloadIntervalId);
          mockDownloadIntervalId = null;
        }
        downloadProgress = null;
        updateDownloaded = true;
        debugPrint("AUTO_UPDATER", "[MOCK] Update Downloaded", availableUpdate);
        updateEmitter.emit("status-changed"); // Final status update for downloaded
      }
    }, MOCK_DATA.transportInterval);

    return true;
  }

  // Real download logic
  if (downloadProgress || updateDownloaded || !isAutoUpdateSupported(process.platform)) {
    return false;
  }

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
  const canAutoUpdate = isAutoUpdateSupported(process.platform);
  autoUpdater.autoDownload = autoUpdate === true && canAutoUpdate;
}

onSettingsCached().then(() => {
  // Update Auto Updater Config
  updateAutoUpdaterConfig();

  settingsEmitter.on("settings-changed", () => {
    updateAutoUpdaterConfig();
  });

  // Run after App Ready
  app.whenReady().then(() => {
    // Connect Listeners and start interval only if not using mock data
    if (!MOCK_DATA_ENABLED) {
      connectUpdaterListeners();
    }

    // Initial check for updates (works for both mock and real)
    checkForUpdates();
    setInterval(checkForUpdates, 1000 * 60 * 15); // Check every 15 minutes
  });
});
