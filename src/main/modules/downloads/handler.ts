/**
 * Chrome-like download handler with .crdownload temporary files.
 *
 * Flow:
 * 1. Start download to `Downloads/Unconfirmed {id}.crdownload` (visible temp file).
 * 2. Show save dialog to user (async, doesn't block download).
 * 3. When user confirms:
 *    - If final location is in Downloads folder → keep using same file
 *    - If final location is different folder → move temp file there
 * 4. On completion: rename `.crdownload` to final filename.
 */

import { app, dialog, type DownloadItem, type Session, type WebContents } from "electron";
import path from "path";
import fs from "fs";
import { debugError, debugPrint } from "@/modules/output";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";

// Conditionally import macOS progress module
type MacOSProgress = typeof import("./macos-progress");
let macosProgress: MacOSProgress | null = null;
async function ensureMacosProgressModule(): Promise<MacOSProgress | null> {
  if (process.platform !== "darwin") return null;
  if (macosProgress) return macosProgress;
  try {
    const mod = await import("./macos-progress");
    macosProgress = mod;
    return mod;
  } catch (err) {
    debugError("DOWNLOADS", "Failed to load macOS progress module:", err);
    return null;
  }
}
ensureMacosProgressModule();

/**
 * How we moved the .crdownload file to the user's chosen directory.
 * - `same-dir` — final location is same directory, no move needed
 * - `moved` — file renamed to new directory successfully
 * - `hardlink` / `symlink` — two paths point at same bytes (fallback for cross-device)
 * - `placeholder` — decoy empty file only (last resort)
 * - `failed` — could not move; download stays in original location
 */
type MirrorKind = "same-dir" | "moved" | "hardlink" | "symlink" | "placeholder" | "failed";

interface DownloadMetadata {
  /** Where the bytes live *right now* (Downloads temp, or moved to final dir). */
  crdownloadPath: string;
  finalPath: string | null; // null until user confirms save dialog
  progressId: string | null;
  lastUpdate: number;
  lastBytes: number;
  initialTotalBytes: number;
  /** Ensures move runs once, on first `progressing` tick after user confirms. */
  mirrorSetup: boolean;
  mirrorKind?: MirrorKind;
  /** True once the user confirms the save dialog. Events before this are handled immediately. */
  saveConfirmed: boolean;
  /** Download finished/cancelled before user confirmed save dialog. */
  earlyCompletion?: { state: "completed" | "cancelled" | "interrupted" };
}

const activeDownloads = new Map<DownloadItem, DownloadMetadata>();

function generateCrdownloadNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Visible basename only, e.g. `Unconfirmed 685304.crdownload`. */
function generateCrdownloadBasename(): string {
  return `Unconfirmed ${generateCrdownloadNumber()}.crdownload`;
}

/**
 * Move the in-progress download to the user's chosen directory.
 * Tries cheapest/best first; `rename` fails across volumes (`EXDEV`), so we fall back to links.
 */
function moveCrdownloadToFinalDir(
  currentPath: string,
  finalDir: string,
  crdownloadBasename: string
): { kind: MirrorKind; newPath: string } {
  const targetPath = path.join(finalDir, crdownloadBasename);

  // Same directory - no move needed
  if (path.dirname(currentPath) === finalDir) {
    return { kind: "same-dir", newPath: currentPath };
  }

  // Remove existing file at target if it exists
  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
    } catch {
      /* ignore */
    }
  }

  // Same volume: one inode moves to target; open FD from Chromium keeps working.
  try {
    fs.renameSync(currentPath, targetPath);
    return { kind: "moved", newPath: targetPath };
  } catch {
    /* continue */
  }

  // Same volume, second name for the same inode.
  try {
    fs.linkSync(currentPath, targetPath);
    return { kind: "hardlink", newPath: targetPath };
  } catch {
    /* continue */
  }

  // Cross-volume: symlink to absolute path.
  try {
    fs.symlinkSync(currentPath, targetPath);
    return { kind: "symlink", newPath: targetPath };
  } catch {
    /* continue */
  }

  // Last resort: empty decoy at target path.
  try {
    fs.writeFileSync(targetPath, "");
    return { kind: "placeholder", newPath: currentPath };
  } catch (err) {
    debugError("DOWNLOADS", "Could not move .crdownload to user path:", err);
    return { kind: "failed", newPath: currentPath };
  }
}

/** Removes the symlink/hardlink/placeholder if one was created. */
function removeSecondaryPath(primaryPath: string, secondaryPath: string): void {
  if (primaryPath === secondaryPath) return;
  try {
    if (fs.existsSync(secondaryPath)) {
      const st = fs.lstatSync(secondaryPath);
      if (st.isSymbolicLink() || st.isFile()) {
        fs.unlinkSync(secondaryPath);
      }
    }
  } catch (err) {
    debugError("DOWNLOADS", "Failed to remove secondary .crdownload path:", err);
  }
}

/**
 * Handles download completion/cancellation logic.
 * Separated so it can be called both immediately (if user confirmed) or deferred (if not).
 */
function handleDownloadCompletion(
  _item: DownloadItem,
  meta: DownloadMetadata,
  state: "completed" | "cancelled" | "interrupted",
  mp: MacOSProgress | null,
  crdownloadBasename: string
): void {
  if (state === "completed") {
    debugPrint("DOWNLOADS", `Download completed: ${meta.crdownloadPath}`);

    if (mp && meta.progressId) {
      mp.completeFileProgress(meta.progressId);
    }

    // Only move to final path if user confirmed save dialog
    if (meta.saveConfirmed && meta.finalPath) {
      // Clean up secondary path if we created a link/symlink
      if (
        meta.mirrorKind &&
        meta.mirrorKind !== "same-dir" &&
        meta.mirrorKind !== "moved" &&
        meta.mirrorKind !== "failed"
      ) {
        const secondaryPath = path.join(path.dirname(meta.finalPath), crdownloadBasename);
        removeSecondaryPath(meta.crdownloadPath, secondaryPath);
      }

      try {
        if (fs.existsSync(meta.finalPath)) {
          fs.unlinkSync(meta.finalPath);
        }

        fs.renameSync(meta.crdownloadPath, meta.finalPath);
        debugPrint("DOWNLOADS", `Moved to final path: ${meta.finalPath}`);
      } catch {
        // e.g. cross-device rename
        try {
          fs.copyFileSync(meta.crdownloadPath, meta.finalPath);
          fs.unlinkSync(meta.crdownloadPath);
          debugPrint("DOWNLOADS", `Copied to final path: ${meta.finalPath}`);
        } catch (copyErr) {
          debugError("DOWNLOADS", `Failed to move download:`, copyErr);
        }
      }
    } else {
      // Download completed before user chose save location; leave temp file
      debugPrint("DOWNLOADS", `Download completed but no save location chosen: ${meta.crdownloadPath}`);
    }
  } else if (state === "cancelled") {
    debugPrint("DOWNLOADS", `Download cancelled: ${meta.crdownloadPath}`);

    if (mp && meta.progressId) {
      mp.cancelFileProgress(meta.progressId);
    }

    // Clean up secondary path if we created one
    if (
      meta.mirrorKind &&
      meta.finalPath &&
      meta.mirrorKind !== "same-dir" &&
      meta.mirrorKind !== "moved" &&
      meta.mirrorKind !== "failed"
    ) {
      const secondaryPath = path.join(path.dirname(meta.finalPath), crdownloadBasename);
      removeSecondaryPath(meta.crdownloadPath, secondaryPath);
    }

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

    if (mp && meta.progressId) {
      mp.cancelFileProgress(meta.progressId);
    }

    // Leave partial files on disk for recovery; only remove secondary path if present
    if (
      meta.mirrorKind &&
      meta.finalPath &&
      meta.mirrorKind !== "same-dir" &&
      meta.mirrorKind !== "moved" &&
      meta.mirrorKind !== "failed"
    ) {
      const secondaryPath = path.join(path.dirname(meta.finalPath), crdownloadBasename);
      removeSecondaryPath(meta.crdownloadPath, secondaryPath);
    }
  }
}

/** Main `will-download` handler: sync setup, async dialog, then event-driven move + completion. */
export function handleDownload(_webContents: WebContents, item: DownloadItem): void {
  const suggestedFilename = item.getFilename();
  const downloadsDir = app.getPath("downloads");
  const defaultPath = path.join(downloadsDir, suggestedFilename);

  const crdownloadBasename = generateCrdownloadBasename();
  // Start with visible file in Downloads (NO dot prefix)
  const crdownloadPath = path.join(downloadsDir, crdownloadBasename);

  debugPrint("DOWNLOADS", `Download requested: ${suggestedFilename}`);
  debugPrint("DOWNLOADS", `  temp file: ${crdownloadPath}`);

  // Electron requires `setSavePath` before this handler returns.
  item.setSavePath(crdownloadPath);

  const window = browserWindowsController.getWindowFromWebContents(_webContents);
  if (!window) {
    item.cancel();
    return;
  }

  // Create metadata IMMEDIATELY so events can be processed even before save dialog completes.
  const totalBytes = item.getTotalBytes();
  const metadata: DownloadMetadata = {
    crdownloadPath,
    finalPath: null, // Will be set after save dialog
    progressId: null, // Will be set after macOS progress loads
    lastUpdate: Date.now(),
    lastBytes: 0,
    initialTotalBytes: totalBytes,
    mirrorSetup: false,
    saveConfirmed: false
  };
  activeDownloads.set(item, metadata);

  // Dialog + NSProgress cannot block the synchronous `will-download` return path.
  void (async () => {
    const mp = await ensureMacosProgressModule();

    let progressId: string | null = null;
    if (mp) {
      progressId = mp.createFileProgress(crdownloadPath, totalBytes > 0 ? totalBytes : 0, () => {
        debugPrint("DOWNLOADS", `Cancel requested from Finder for: ${suggestedFilename}`);
        item.cancel();
      });
      debugPrint("DOWNLOADS", `macOS progress created: ${progressId}`);
      metadata.progressId = progressId;
    }

    const { filePath: chosenPath, canceled } = await dialog.showSaveDialog(window.browserWindow, {
      defaultPath,
      properties: ["createDirectory", "showOverwriteConfirmation"]
    });

    if (canceled || !chosenPath) {
      debugPrint("DOWNLOADS", `Download cancelled by user: ${suggestedFilename}`);
      if (mp && progressId) {
        mp.cancelFileProgress(progressId);
      }
      item.cancel();
      return;
    }

    const finalPath = chosenPath;
    debugPrint("DOWNLOADS", `User chose final path: ${finalPath}`);

    // Update metadata with final path and mark as confirmed
    metadata.finalPath = finalPath;
    metadata.saveConfirmed = true;

    // If download already completed/cancelled before dialog finished, handle it now
    if (metadata.earlyCompletion) {
      debugPrint("DOWNLOADS", `Handling early completion (${metadata.earlyCompletion.state})`);
      handleDownloadCompletion(item, metadata, metadata.earlyCompletion.state, mp, crdownloadBasename);
      activeDownloads.delete(item);
    }
  })();

  item.on("updated", (_event, state) => {
    const meta = activeDownloads.get(item);
    if (!meta) return;

    // Only move file if user has confirmed save location and file exists
    if (
      state === "progressing" &&
      !meta.mirrorSetup &&
      meta.saveConfirmed &&
      meta.finalPath &&
      fs.existsSync(meta.crdownloadPath)
    ) {
      meta.mirrorSetup = true;
      const finalDir = path.dirname(meta.finalPath);
      const result = moveCrdownloadToFinalDir(meta.crdownloadPath, finalDir, crdownloadBasename);
      meta.mirrorKind = result.kind;
      meta.crdownloadPath = result.newPath;

      debugPrint("DOWNLOADS", `In-progress .crdownload (${result.kind}): ${result.newPath}`);

      // Update macOS progress to track the new path
      if (macosProgress && meta.progressId && result.newPath && fs.existsSync(result.newPath)) {
        macosProgress.updateFileProgressPath(meta.progressId, result.newPath);
      }
    }

    if (state === "progressing") {
      const receivedBytes = item.getReceivedBytes();
      const total = item.getTotalBytes();
      const now = Date.now();

      if (macosProgress && meta.progressId) {
        macosProgress.updateFileProgress(meta.progressId, receivedBytes);

        if (total > 0 && meta.initialTotalBytes === 0) {
          macosProgress.updateFileProgressTotal(meta.progressId, total);
          meta.initialTotalBytes = total;
        }

        // Throttle derived stats so we do not hammer AppKit every progress tick.
        const timeDelta = (now - meta.lastUpdate) / 1000;
        if (timeDelta > 0.5) {
          const bytesDelta = receivedBytes - meta.lastBytes;
          const bytesPerSecond = bytesDelta / timeDelta;
          macosProgress.updateFileProgressThroughput(meta.progressId, bytesPerSecond);

          if (bytesPerSecond > 0 && total > 0) {
            const remainingBytes = total - receivedBytes;
            const secondsRemaining = remainingBytes / bytesPerSecond;
            macosProgress.updateFileProgressEstimatedTime(meta.progressId, secondsRemaining);
          }

          meta.lastUpdate = now;
          meta.lastBytes = receivedBytes;
        }
      }

      if (total > 0) {
        const percent = Math.round((receivedBytes / total) * 100);
        debugPrint("DOWNLOADS", `Progress: ${percent}% (${receivedBytes}/${total} bytes)`);
      }
    } else if (state === "interrupted") {
      debugPrint("DOWNLOADS", `Download interrupted: ${meta.crdownloadPath}`);
    }
  });

  item.once("done", async (_event, state) => {
    const meta = activeDownloads.get(item);
    if (!meta) return;

    // If save dialog hasn't been confirmed yet, mark as early completion
    // The async dialog handler will process it when ready
    if (!meta.saveConfirmed) {
      debugPrint("DOWNLOADS", `Download finished (${state}) before save dialog confirmed, deferring cleanup`);
      meta.earlyCompletion = { state };
      return;
    }

    // Save confirmed, handle immediately
    activeDownloads.delete(item);
    const mp = await ensureMacosProgressModule();
    handleDownloadCompletion(item, meta, state, mp, crdownloadBasename);
  });
}

export function registerDownloadHandler(session: Session): void {
  session.on("will-download", (_event, item, webContents) => {
    // Register per item inside `handleDownload` (`on` / `once` on `DownloadItem`).
    handleDownload(webContents, item);
  });

  debugPrint("DOWNLOADS", "Download handler registered for session");
}
