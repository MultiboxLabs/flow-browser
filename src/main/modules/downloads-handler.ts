/**
 * Chrome-like download handler with .crdownload temporary files.
 *
 * Intercepts downloads and:
 * 1. Pauses download and shows a save dialog for the user to choose location
 * 2. Saves as `Unconfirmed {6-digit-number}.crdownload` during download
 * 3. Shows macOS native progress bar on the file in Finder
 * 4. Renames/moves to the final filename when complete
 */

import { app, dialog, type DownloadItem, type Session, type WebContents } from "electron";
import path from "path";
import fs from "fs";
import { debugError, debugPrint } from "@/modules/output";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";

// Conditionally import macOS progress module
let macosProgress: typeof import("@/modules/macos-progress") | null = null;
if (process.platform === "darwin") {
  import("@/modules/macos-progress")
    .then((module) => {
      macosProgress = module;
    })
    .catch((err) => {
      debugError("DOWNLOADS", "Failed to load macOS progress module:", err);
    });
}

// Track active downloads with their metadata
interface DownloadMetadata {
  crdownloadPath: string;
  finalPath: string;
  progressId: string | null;
  lastUpdate: number;
  lastBytes: number;
  initialTotalBytes: number;
}

const activeDownloads = new Map<DownloadItem, DownloadMetadata>();

/**
 * Generate a random 6-digit number for the .crdownload filename.
 */
function generateCrdownloadNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate the .crdownload filename for a download.
 * Format: "Unconfirmed {6-digit-number}.crdownload"
 */
function generateCrdownloadFilename(): string {
  return `Unconfirmed ${generateCrdownloadNumber()}.crdownload`;
}

/**
 * Handles the will-download event for a session.
 * This is the main entry point for intercepting downloads.
 *
 * Strategy:
 * 1. Set save path synchronously (required by Electron)
 * 2. Pause immediately so no data transfers
 * 3. Show save dialog
 * 4. Resume after user confirms, or cancel if they decline
 * 5. Move file to chosen location on completion
 */
export function handleDownload(_webContents: WebContents, item: DownloadItem): void {
  const suggestedFilename = item.getFilename();
  const downloadsDir = app.getPath("downloads");
  const defaultPath = path.join(downloadsDir, suggestedFilename);

  debugPrint("DOWNLOADS", `Download requested: ${suggestedFilename}`);

  // Generate .crdownload path in downloads directory (must be set synchronously)
  const crdownloadFilename = generateCrdownloadFilename();
  const crdownloadPath = path.join(downloadsDir, crdownloadFilename);

  // MUST set save path synchronously before handler returns
  item.setSavePath(crdownloadPath);

  // Pause immediately - no data will transfer until we resume
  item.pause();

  debugPrint("DOWNLOADS", `Download paused, showing save dialog: ${suggestedFilename}`);
  debugPrint("DOWNLOADS", `  temp crdownload: ${crdownloadPath}`);

  // Show save dialog while download is paused
  const window = browserWindowsController.getWindowFromWebContents(_webContents);
  if (!window) {
    item.cancel();
    return;
  }
  dialog
    .showSaveDialog(window.browserWindow, {
      defaultPath,
      properties: ["createDirectory", "showOverwriteConfirmation"]
    })
    .then(({ filePath: chosenPath, canceled }) => {
      if (canceled || !chosenPath) {
        debugPrint("DOWNLOADS", `Download cancelled by user: ${suggestedFilename}`);
        item.cancel();
        return;
      }

      const finalPath = chosenPath;
      debugPrint("DOWNLOADS", `User chose: ${finalPath}`);

      // Get total bytes for progress
      const totalBytes = item.getTotalBytes();

      // Create macOS progress indicator
      let progressId: string | null = null;
      if (macosProgress) {
        progressId = macosProgress.createFileProgress(crdownloadPath, totalBytes > 0 ? totalBytes : 0, () => {
          debugPrint("DOWNLOADS", `Cancel requested from Finder for: ${suggestedFilename}`);
          item.cancel();
        });
        debugPrint("DOWNLOADS", `macOS progress created: ${progressId}`);
      }

      // Store metadata for this download
      const metadata: DownloadMetadata = {
        crdownloadPath,
        finalPath,
        progressId,
        lastUpdate: Date.now(),
        lastBytes: 0,
        initialTotalBytes: totalBytes
      };
      activeDownloads.set(item, metadata);

      // Resume the download - now data will start transferring
      item.resume();
      debugPrint("DOWNLOADS", `Download resumed: ${suggestedFilename}`);
    });

  // Track download progress
  item.on("updated", (_event, state) => {
    const meta = activeDownloads.get(item);
    debugPrint("DOWNLOADS", `Download updated: ${state}`);
    if (!meta) return;

    if (state === "progressing") {
      const receivedBytes = item.getReceivedBytes();
      const total = item.getTotalBytes();
      const now = Date.now();

      // Update macOS progress
      if (macosProgress && meta.progressId) {
        macosProgress.updateFileProgress(meta.progressId, receivedBytes);

        // Update total if it wasn't known initially
        if (total > 0 && meta.initialTotalBytes === 0) {
          macosProgress.updateFileProgressTotal(meta.progressId, total);
          meta.initialTotalBytes = total;
        }

        // Calculate and update throughput (bytes per second)
        const timeDelta = (now - meta.lastUpdate) / 1000; // seconds
        if (timeDelta > 0.5) {
          // Update every 500ms
          const bytesDelta = receivedBytes - meta.lastBytes;
          const bytesPerSecond = bytesDelta / timeDelta;

          macosProgress.updateFileProgressThroughput(meta.progressId, bytesPerSecond);

          // Estimate time remaining
          if (bytesPerSecond > 0 && total > 0) {
            const remainingBytes = total - receivedBytes;
            const secondsRemaining = remainingBytes / bytesPerSecond;
            macosProgress.updateFileProgressEstimatedTime(meta.progressId, secondsRemaining);
          }

          meta.lastUpdate = now;
          meta.lastBytes = receivedBytes;
        }
      }

      // Log progress periodically
      if (total > 0) {
        const percent = Math.round((receivedBytes / total) * 100);
        debugPrint("DOWNLOADS", `Progress: ${percent}% (${receivedBytes}/${total} bytes)`);
      }
    } else if (state === "interrupted") {
      debugPrint("DOWNLOADS", `Download interrupted: ${meta.crdownloadPath}`);
    }
  });

  // Handle download completion
  item.once("done", (_event, state) => {
    const meta = activeDownloads.get(item);
    if (!meta) return;

    activeDownloads.delete(item);

    if (state === "completed") {
      debugPrint("DOWNLOADS", `Download completed: ${meta.crdownloadPath}`);

      // Complete macOS progress
      if (macosProgress && meta.progressId) {
        macosProgress.completeFileProgress(meta.progressId);
      }

      // Move/rename from .crdownload to final filename
      try {
        // If final path exists (shouldn't happen with overwrite confirmation), remove it
        if (fs.existsSync(meta.finalPath)) {
          fs.unlinkSync(meta.finalPath);
        }

        // Move the file (works across different directories)
        fs.renameSync(meta.crdownloadPath, meta.finalPath);
        debugPrint("DOWNLOADS", `Moved to final path: ${meta.finalPath}`);
      } catch {
        // If rename fails (cross-device), try copy + delete
        try {
          fs.copyFileSync(meta.crdownloadPath, meta.finalPath);
          fs.unlinkSync(meta.crdownloadPath);
          debugPrint("DOWNLOADS", `Copied to final path: ${meta.finalPath}`);
        } catch (copyErr) {
          debugError("DOWNLOADS", `Failed to move download:`, copyErr);
          // File remains as .crdownload if move fails
        }
      }
    } else if (state === "cancelled") {
      debugPrint("DOWNLOADS", `Download cancelled: ${meta.crdownloadPath}`);

      // Cancel macOS progress
      if (macosProgress && meta.progressId) {
        macosProgress.cancelFileProgress(meta.progressId);
      }

      // Clean up partial .crdownload file
      try {
        if (fs.existsSync(meta.crdownloadPath)) {
          fs.unlinkSync(meta.crdownloadPath);
          debugPrint("DOWNLOADS", `Cleaned up partial download: ${meta.crdownloadPath}`);
        }
      } catch (err) {
        debugError("DOWNLOADS", `Failed to clean up partial download:`, err);
      }
    } else if (state === "interrupted") {
      debugPrint("DOWNLOADS", `Download interrupted (final): ${meta.crdownloadPath}`);

      // Cancel macOS progress on interruption
      if (macosProgress && meta.progressId) {
        macosProgress.cancelFileProgress(meta.progressId);
      }
    }
  });
}

/**
 * Register the download handler with a session.
 * Call this function for each session where you want to intercept downloads.
 */
export function registerDownloadHandler(session: Session): void {
  session.on("will-download", (_event, item, webContents) => {
    handleDownload(webContents, item);
  });

  debugPrint("DOWNLOADS", "Download handler registered for session");
}
