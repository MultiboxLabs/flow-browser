import { debugPrint } from "@/modules/output";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { sleep } from "@/modules/utils";
import { getVersionUpdatedFrom, markUpdateStarted } from "@/saving/ephemeral";
import { getSettingValueById, onSettingsCached, settingsEmitter } from "@/saving/settings";
import { app } from "electron";
import { autoUpdater, ProgressInfo, UpdateInfo, UpdateCheckResult } from "electron-updater";
import { UpdateStatus } from "~/types/updates";

// Mock Data //
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

// Constants //
const SUPPORTED_PLATFORMS: NodeJS.Platform[] = ["win32", "linux", "darwin"];

type AutoUpdateControllerEvents = {
  "status-changed": [];
};

export class AutoUpdateController extends TypedEventEmitter<AutoUpdateControllerEvents> {
  public hasUpdated: boolean = false;
  private availableUpdate: UpdateInfo | null = null;
  private downloadProgress: ProgressInfo | null = null;
  private updateDownloaded: boolean = false;
  private mockDownloadIntervalId: NodeJS.Timeout | null = null;
  private mockBytesDownloaded: number = 0;

  public isAutoUpdateSupported(platform: NodeJS.Platform): boolean {
    if (MOCK_DATA_ENABLED) return MOCK_DATA.isSupported;

    return SUPPORTED_PLATFORMS.includes(platform);
  }

  public async checkForUpdates(): Promise<UpdateCheckResult | null> {
    if (MOCK_DATA_ENABLED) {
      debugPrint("AUTO_UPDATER", "[MOCK] Checking for updates");

      // Simulate a delay
      await sleep(MOCK_DATA.timeForUpdateCheck);

      // Simulate finding an update based on mock data
      const mockUpdateInfo: UpdateInfo = {
        version: MOCK_DATA.version,
        files: [{ url: "mock.zip", size: MOCK_DATA.fileSize, sha512: "mock-sha512-zip" }],
        path: "mock.zip", // Path might not be relevant for mock, but required by type
        sha512: "mock-sha512", // Required by type
        releaseDate: new Date().toISOString() // Required by type
        // Add other fields required by UpdateInfo if necessary, e.g., releaseName, releaseNotes
      };
      this.availableUpdate = mockUpdateInfo;
      this.emit("status-changed");
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

  private connectUpdaterListeners() {
    autoUpdater.on("update-available", (updateInfo) => {
      debugPrint("AUTO_UPDATER", "Update Available", updateInfo);
      this.availableUpdate = updateInfo;
      this.emit("status-changed");
    });

    autoUpdater.on("update-not-available", (updateInfo) => {
      debugPrint("AUTO_UPDATER", "Update Not Available", updateInfo);
    });

    autoUpdater.on("download-progress", (progress) => {
      debugPrint("AUTO_UPDATER", "Download Progress", progress);
      this.downloadProgress = progress;
      this.emit("status-changed");
    });

    autoUpdater.on("update-downloaded", (updateInfo) => {
      debugPrint("AUTO_UPDATER", "Update Downloaded", updateInfo);
      this.availableUpdate = updateInfo;
      this.downloadProgress = null;
      this.updateDownloaded = true;
      this.emit("status-changed");
    });
  }

  public getUpdateStatus(): UpdateStatus {
    return {
      availableUpdate: this.availableUpdate,
      downloadProgress: this.downloadProgress,
      updateDownloaded: this.updateDownloaded
    };
  }

  public downloadUpdate(): boolean {
    if (MOCK_DATA_ENABLED) {
      if (this.downloadProgress || this.updateDownloaded || !this.availableUpdate) {
        debugPrint(
          "AUTO_UPDATER",
          "[MOCK] Download not started (already in progress, downloaded, or no update available)"
        );
        return false;
      }

      debugPrint("AUTO_UPDATER", "[MOCK] Starting download simulation");
      this.mockBytesDownloaded = 0;
      this.downloadProgress = {
        // Initial progress state
        bytesPerSecond: 0,
        percent: 0,
        total: MOCK_DATA.fileSize,
        transferred: 0,
        delta: 0 // Add delta field
      };
      this.emit("status-changed"); // Notify UI that download started

      this.mockDownloadIntervalId = setInterval(() => {
        this.mockBytesDownloaded += MOCK_DATA.dataPerInterval;
        this.mockBytesDownloaded = Math.min(this.mockBytesDownloaded, MOCK_DATA.fileSize);

        const percent = (this.mockBytesDownloaded / MOCK_DATA.fileSize) * 100;
        // Approximate bytesPerSecond based on interval data transfer
        const bytesPerSecond = MOCK_DATA.dataPerInterval / (MOCK_DATA.transportInterval / 1000);

        this.downloadProgress = {
          bytesPerSecond,
          percent,
          total: MOCK_DATA.fileSize,
          transferred: this.mockBytesDownloaded,
          delta: MOCK_DATA.dataPerInterval // Add delta field
        };
        debugPrint("AUTO_UPDATER", "[MOCK] Download Progress", this.downloadProgress);
        this.emit("status-changed");

        if (this.mockBytesDownloaded >= MOCK_DATA.fileSize) {
          if (this.mockDownloadIntervalId) {
            clearInterval(this.mockDownloadIntervalId);
            this.mockDownloadIntervalId = null;
          }
          this.downloadProgress = null;
          this.updateDownloaded = true;
          debugPrint("AUTO_UPDATER", "[MOCK] Update Downloaded", this.availableUpdate);
          this.emit("status-changed"); // Final status update for downloaded
        }
      }, MOCK_DATA.transportInterval);

      return true;
    }

    // Real download logic
    if (this.downloadProgress || this.updateDownloaded || !this.isAutoUpdateSupported(process.platform)) {
      return false;
    }

    autoUpdater.downloadUpdate();
    return true;
  }

  public installUpdate(): boolean {
    if (this.updateDownloaded) {
      markUpdateStarted(app.getVersion());
      autoUpdater.quitAndInstall();
      return true;
    }
    return false;
  }

  private async updateAutoUpdaterConfig() {
    const autoUpdate = getSettingValueById("autoUpdate") as boolean | undefined;
    const canAutoUpdate = this.isAutoUpdateSupported(process.platform);
    autoUpdater.autoDownload = autoUpdate === true && canAutoUpdate;
  }

  public async initialize() {
    await onSettingsCached();

    // Update Auto Updater Config
    await this.updateAutoUpdaterConfig();

    settingsEmitter.on("settings-changed", () => {
      this.updateAutoUpdaterConfig();
    });

    // Run after App Ready
    await app.whenReady();

    // Connect Listeners and start interval only if not using mock data
    if (!MOCK_DATA_ENABLED) {
      this.connectUpdaterListeners();
    }

    // Initial check for updates (works for both mock and real)
    this.checkForUpdates();
    setInterval(() => this.checkForUpdates(), 1000 * 60 * 15); // Check every 15 minutes
  }
}

// Create and export singleton instance
export const autoUpdateController = new AutoUpdateController();

// Initialize the controller
autoUpdateController.initialize();

// Check for pending update
getVersionUpdatedFrom()
  .catch(() => undefined)
  .then((updatedFromVersion) => {
    if (updatedFromVersion) {
      debugPrint("AUTO_UPDATER", `Update from version ${updatedFromVersion}`);
      const currentVersion = app.getVersion();
      if (currentVersion !== updatedFromVersion) {
        autoUpdateController.hasUpdated = true;
      }
    }
  });
