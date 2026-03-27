import { NSProgress, NSURL, NSNumber, type _NSProgress } from "objcjs-types/Foundation";
import { NSProgressFileOperationKind, NSProgressKind } from "objcjs-types/Foundation";
import { NSStringFromString } from "objcjs-types/helpers";
import { debugError, debugPrint } from "@/modules/output";

const activeProgressMap = new Map<string, _NSProgress>();
const cancelCallbackMap = new Map<string, () => void>();

export function createFileProgress(filePath: string, totalBytes: number, onCancel?: () => void): string | null {
  try {
    const progressId = `${filePath}-${Date.now()}`;
    const progress = NSProgress.discreteProgressWithTotalUnitCount$(Math.max(totalBytes, 0));

    progress.setKind$(NSStringFromString(NSProgressKind.File));
    progress.setFileOperationKind$(NSStringFromString(NSProgressFileOperationKind.Downloading));
    progress.setFileURL$(NSURL.fileURLWithPath$(NSStringFromString(filePath)));
    progress.setCompletedUnitCount$(0);
    progress.setCancellable$(true);
    progress.setPausable$(false);

    if (onCancel) {
      cancelCallbackMap.set(progressId, onCancel);
      progress.setCancellationHandler$(() => {
        const callback = cancelCallbackMap.get(progressId);
        if (callback) {
          debugPrint("DOWNLOADS", `macOS: cancel requested from Finder for ${filePath}`);
          callback();
        }
      });
    }

    progress.publish();
    activeProgressMap.set(progressId, progress);

    debugPrint("DOWNLOADS", `macOS: created progress for ${filePath}`);
    return progressId;
  } catch (err) {
    debugError("DOWNLOADS", "macOS: createFileProgress failed:", err);
    return null;
  }
}

export function updateFileProgress(progressId: string, completedBytes: number): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) return;
    progress.setCompletedUnitCount$(Math.max(completedBytes, 0));
  } catch (err) {
    debugError("DOWNLOADS", "macOS: updateFileProgress failed:", err);
  }
}

export function updateFileProgressTotal(progressId: string, totalBytes: number): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) return;
    progress.setTotalUnitCount$(Math.max(totalBytes, 0));
  } catch (err) {
    debugError("DOWNLOADS", "macOS: updateFileProgressTotal failed:", err);
  }
}

export function updateFileProgressThroughput(progressId: string, bytesPerSecond: number): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) return;
    progress.setThroughput$(NSNumber.numberWithDouble$(Math.max(bytesPerSecond, 0)));
  } catch (err) {
    debugError("DOWNLOADS", "macOS: updateFileProgressThroughput failed:", err);
  }
}

export function updateFileProgressEstimatedTime(progressId: string, seconds: number): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) return;
    progress.setEstimatedTimeRemaining$(NSNumber.numberWithDouble$(Math.max(seconds, 0)));
  } catch (err) {
    debugError("DOWNLOADS", "macOS: updateFileProgressEstimatedTime failed:", err);
  }
}

export function completeFileProgress(progressId: string, completedBytes: number): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) return;

    const finalCount = Math.max(completedBytes, progress.totalUnitCount(), 0);
    progress.setTotalUnitCount$(finalCount);
    progress.setCompletedUnitCount$(finalCount);
    progress.setCancellationHandler$(null);
    cancelCallbackMap.delete(progressId);
    progress.unpublish();
    activeProgressMap.delete(progressId);

    debugPrint("DOWNLOADS", `macOS: completed progress for ID ${progressId}`);
  } catch (err) {
    debugError("DOWNLOADS", "macOS: completeFileProgress failed:", err);
  }
}

export function cancelFileProgress(progressId: string): void {
  try {
    const progress = activeProgressMap.get(progressId);
    if (!progress) return;

    progress.setCancellationHandler$(null);
    cancelCallbackMap.delete(progressId);
    progress.cancel();
    progress.unpublish();
    activeProgressMap.delete(progressId);

    debugPrint("DOWNLOADS", `macOS: cancelled progress for ID ${progressId}`);
  } catch (err) {
    debugError("DOWNLOADS", "macOS: cancelFileProgress failed:", err);
  }
}

export function recreateFileProgressAtPath(
  progressId: string,
  newFilePath: string,
  onCancel?: () => void
): string | null {
  try {
    const oldProgress = activeProgressMap.get(progressId);
    if (!oldProgress) return null;

    const completedBytes = oldProgress.completedUnitCount();
    const totalBytes = oldProgress.totalUnitCount();
    const throughput = oldProgress.throughput();
    const estimatedTime = oldProgress.estimatedTimeRemaining();

    cancelFileProgress(progressId);

    const newProgressId = createFileProgress(newFilePath, totalBytes, onCancel);
    if (!newProgressId) return null;

    const newProgress = activeProgressMap.get(newProgressId);
    if (newProgress) {
      newProgress.setCompletedUnitCount$(completedBytes);
      if (throughput) {
        newProgress.setThroughput$(throughput);
      }
      if (estimatedTime) {
        newProgress.setEstimatedTimeRemaining$(estimatedTime);
      }
    }

    debugPrint("DOWNLOADS", `macOS: recreated progress at ${newFilePath}`);
    return newProgressId;
  } catch (err) {
    debugError("DOWNLOADS", "macOS: recreateFileProgressAtPath failed:", err);
    return null;
  }
}
