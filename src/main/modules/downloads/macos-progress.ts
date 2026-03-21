/**
 * macOS-specific file download progress using NSProgress.
 *
 * Uses the NSProgress publish API to show native download progress
 * indicators on files in Finder (e.g., the progress bar on .crdownload files).
 */

// @ts-ignore This package is only available on macOS.
import { NSProgress, NSURL, NSNumber, type _NSProgress } from "objcjs-types/Foundation";
import { NSProgressFileOperationKind, NSProgressKind } from "objcjs-types/Foundation";
import { NSStringFromString } from "objcjs-types/helpers";
import { debugError, debugPrint } from "@/modules/output";

// Track active progress instances so we can unpublish them
const activeProgressMap = new Map<string, _NSProgress>();

// Track cancel callbacks
const cancelCallbackMap = new Map<string, () => void>();

/**
 * Create and publish an NSProgress for a file download.
 * This shows the native macOS progress bar on the file in Finder.
 *
 * @param filePath - The absolute path to the file being downloaded
 * @param totalBytes - Total size of the download in bytes
 * @param onCancel - Callback invoked when user clicks cancel in Finder
 * @returns A unique ID to reference this progress, or null on failure
 */
export function createFileProgress(filePath: string, totalBytes: number, onCancel?: () => void): string | null {
  try {
    // Generate a unique ID first (needed for the closure)
    const progressId = `${filePath}-${Date.now()}`;

    // Create a discrete progress (not attached to any parent)
    const progress = NSProgress.discreteProgressWithTotalUnitCount$(totalBytes);

    // Configure as a file download
    progress.setKind$(NSStringFromString(NSProgressKind.File));
    progress.setFileOperationKind$(NSStringFromString(NSProgressFileOperationKind.Downloading));

    // Set the file URL
    const nsPath = NSStringFromString(filePath);
    const fileURL = NSURL.fileURLWithPath$(nsPath);
    progress.setFileURL$(fileURL);

    // Set initial completed count to 0
    progress.setCompletedUnitCount$(0);

    // Make cancellable but not pausable (matching typical download behavior)
    progress.setCancellable$(true);
    progress.setPausable$(false);

    // Set up cancellation handler if callback provided
    if (onCancel) {
      cancelCallbackMap.set(progressId, onCancel);
      progress.setCancellationHandler$(() => {
        debugPrint("DOWNLOADS", `macOS: cancel requested from Finder for ${progressId}`);
        const callback = cancelCallbackMap.get(progressId);
        if (callback) {
          callback();
        }
      });
    }

    // Publish the progress so Finder can observe it
    progress.publish();

    // Store the progress
    activeProgressMap.set(progressId, progress);

    debugPrint("DOWNLOADS", `macOS: created progress for ${filePath}, total: ${totalBytes} bytes`);
    return progressId;
  } catch (err) {
    debugError("DOWNLOADS", "macOS: createFileProgress failed:", err);
    return null;
  }
}

/**
 * Update the progress of a file download.
 *
 * @param progressId - The ID returned from createFileProgress
 * @param completedBytes - Number of bytes downloaded so far
 */
export function updateFileProgress(progressId: string, completedBytes: number): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) {
      debugError("DOWNLOADS", `macOS: no progress found for ID ${progressId}`);
      return;
    }

    progress.setCompletedUnitCount$(completedBytes);
  } catch (err) {
    debugError("DOWNLOADS", "macOS: updateFileProgress failed:", err);
  }
}

/**
 * Update the total size of a download (useful when total size becomes known later).
 *
 * @param progressId - The ID returned from createFileProgress
 * @param totalBytes - Total size of the download in bytes
 */
export function updateFileProgressTotal(progressId: string, totalBytes: number): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) {
      debugError("DOWNLOADS", `macOS: no progress found for ID ${progressId}`);
      return;
    }

    progress.setTotalUnitCount$(totalBytes);
  } catch (err) {
    debugError("DOWNLOADS", "macOS: updateFileProgressTotal failed:", err);
  }
}

/**
 * Set throughput (download speed) for display.
 *
 * @param progressId - The ID returned from createFileProgress
 * @param bytesPerSecond - Current download speed in bytes per second
 */
export function updateFileProgressThroughput(progressId: string, bytesPerSecond: number): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) {
      return;
    }

    const throughput = NSNumber.numberWithDouble$(bytesPerSecond);
    progress.setThroughput$(throughput);
  } catch (err) {
    debugError("DOWNLOADS", "macOS: updateFileProgressThroughput failed:", err);
  }
}

/**
 * Set estimated time remaining.
 *
 * @param progressId - The ID returned from createFileProgress
 * @param seconds - Estimated seconds remaining
 */
export function updateFileProgressEstimatedTime(progressId: string, seconds: number): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) {
      return;
    }

    const estimatedTime = NSNumber.numberWithDouble$(seconds);
    progress.setEstimatedTimeRemaining$(estimatedTime);
  } catch (err) {
    debugError("DOWNLOADS", "macOS: updateFileProgressEstimatedTime failed:", err);
  }
}

/**
 * Complete and unpublish a file download progress.
 *
 * @param progressId - The ID returned from createFileProgress
 */
export function completeFileProgress(progressId: string): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) {
      debugError("DOWNLOADS", `macOS: no progress found for ID ${progressId}`);
      return;
    }

    // Mark as complete by setting completed = total
    const total = progress.totalUnitCount();
    progress.setCompletedUnitCount$(total);

    // Clear the cancellation handler
    progress.setCancellationHandler$(null);
    cancelCallbackMap.delete(progressId);

    // Unpublish and remove from tracking
    progress.unpublish();
    activeProgressMap.delete(progressId);

    debugPrint("DOWNLOADS", `macOS: completed progress for ID ${progressId}`);
  } catch (err) {
    debugError("DOWNLOADS", "macOS: completeFileProgress failed:", err);
  }
}

/**
 * Cancel and unpublish a file download progress.
 *
 * @param progressId - The ID returned from createFileProgress
 */
export function cancelFileProgress(progressId: string): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) {
      return;
    }

    // Clear the cancellation handler first to avoid re-triggering
    progress.setCancellationHandler$(null);
    cancelCallbackMap.delete(progressId);

    // Cancel the progress
    progress.cancel();

    // Unpublish and remove from tracking
    progress.unpublish();
    activeProgressMap.delete(progressId);

    debugPrint("DOWNLOADS", `macOS: cancelled progress for ID ${progressId}`);
  } catch (err) {
    debugError("DOWNLOADS", "macOS: cancelFileProgress failed:", err);
  }
}

/**
 * Update the file URL for a progress (used when renaming from .crdownload to final name).
 *
 * @param progressId - The ID returned from createFileProgress
 * @param newFilePath - The new absolute path to the file
 */
export function updateFileProgressPath(progressId: string, newFilePath: string): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) {
      debugError("DOWNLOADS", `macOS: no progress found for ID ${progressId}`);
      return;
    }

    const nsPath = NSStringFromString(newFilePath);
    const fileURL = NSURL.fileURLWithPath$(nsPath);
    progress.setFileURL$(fileURL);

    debugPrint("DOWNLOADS", `macOS: updated progress path to ${newFilePath}`);
  } catch (err) {
    debugError("DOWNLOADS", "macOS: updateFileProgressPath failed:", err);
  }
}
