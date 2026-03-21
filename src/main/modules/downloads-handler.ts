/**
 * Chrome-like download handler with .crdownload temporary files.
 *
 * Intercepts downloads and:
 * 1. Pauses download and sets a hidden temp path: `.Unconfirmed {id}.crdownload` in Downloads
 * 2. Publishes macOS NSProgress on that path, then shows the save dialog
 * 3. On confirm, resumes and places the in-progress file beside the chosen save path as
 *    `Unconfirmed {id}.crdownload` (visible — no leading dot): try rename (move) first, then
 *    hard link, symlink, or placeholder
 * 4. On completion, removes any extra mirror entry, renames/moves to the user-chosen filename
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

type MirrorKind = "moved" | "hardlink" | "symlink" | "placeholder" | "failed";

interface DownloadMetadata {
  /** Hidden temp file Electron writes to (e.g. ~/.Unconfirmed 123.crdownload in Downloads). */
  crdownloadPath: string;
  /** User-chosen final path from the save dialog. */
  finalPath: string;
  /** Visible in-progress name next to final path (no leading dot). */
  visibleCrdownloadPath: string;
  progressId: string | null;
  lastUpdate: number;
  lastBytes: number;
  initialTotalBytes: number;
  mirrorSetup: boolean;
  /** How the visible-path .crdownload was created; `moved` means the file only exists at `visibleCrdownloadPath`. */
  mirrorKind?: MirrorKind;
}

const activeDownloads = new Map<DownloadItem, DownloadMetadata>();

function generateCrdownloadNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Visible basename only, e.g. `Unconfirmed 685304.crdownload`. */
function generateCrdownloadBasename(): string {
  return `Unconfirmed ${generateCrdownloadNumber()}.crdownload`;
}

/** Hidden path in Downloads: `.Unconfirmed 685304.crdownload`. */
function hiddenCrdownloadPathInDownloads(downloadsDir: string, crdownloadBasename: string): string {
  return path.join(downloadsDir, `.${crdownloadBasename}`);
}

async function ensureMacosProgressModule(): Promise<typeof import("@/modules/macos-progress") | null> {
  if (process.platform !== "darwin") return null;
  if (macosProgress) return macosProgress;
  try {
    const mod = await import("@/modules/macos-progress");
    macosProgress = mod;
    return mod;
  } catch (err) {
    debugError("DOWNLOADS", "Failed to load macOS progress module:", err);
    return null;
  }
}

/**
 * Prefer moving the temp file to the visible path (same inode; Electron keeps writing).
 * Otherwise hard link, absolute symlink, then empty placeholder.
 */
function mirrorCrdownloadToVisible(hiddenPath: string, visiblePath: string): MirrorKind {
  if (fs.existsSync(visiblePath)) {
    try {
      fs.unlinkSync(visiblePath);
    } catch {
      /* ignore */
    }
  }

  try {
    fs.renameSync(hiddenPath, visiblePath);
    return "moved";
  } catch {
    /* continue */
  }

  try {
    fs.linkSync(hiddenPath, visiblePath);
    return "hardlink";
  } catch {
    /* continue */
  }

  try {
    fs.symlinkSync(hiddenPath, visiblePath);
    return "symlink";
  } catch {
    /* continue */
  }

  try {
    fs.writeFileSync(visiblePath, "");
    return "placeholder";
  } catch (err) {
    debugError("DOWNLOADS", "Could not mirror .crdownload to user path:", err);
    return "failed";
  }
}

function removeMirrorIfNeeded(meta: DownloadMetadata): void {
  try {
    if (fs.existsSync(meta.visibleCrdownloadPath)) {
      const st = fs.lstatSync(meta.visibleCrdownloadPath);
      if (st.isSymbolicLink() || st.isFile()) {
        fs.unlinkSync(meta.visibleCrdownloadPath);
      }
    }
  } catch (err) {
    debugError("DOWNLOADS", "Failed to remove visible .crdownload mirror:", err);
  }
}

/**
 * Handles the will-download event for a session.
 *
 * Strategy:
 * 1. Set save path to hidden `.crdownload` in Downloads (sync)
 * 2. Pause so no bytes flow until the user confirms
 * 3. macOS: NSProgress on hidden path, then save dialog
 * 4. Resume; on first progress, move or mirror to visible path beside chosen filename
 * 5. On done: strip extra mirror if any, move temp file to final name
 */
export function handleDownload(_webContents: WebContents, item: DownloadItem): void {
  const suggestedFilename = item.getFilename();
  const downloadsDir = app.getPath("downloads");
  const defaultPath = path.join(downloadsDir, suggestedFilename);

  const crdownloadBasename = generateCrdownloadBasename();
  const crdownloadPath = hiddenCrdownloadPathInDownloads(downloadsDir, crdownloadBasename);

  debugPrint("DOWNLOADS", `Download requested: ${suggestedFilename}`);
  debugPrint("DOWNLOADS", `  hidden temp: ${crdownloadPath}`);

  item.setSavePath(crdownloadPath);
  item.pause();

  const window = browserWindowsController.getWindowFromWebContents(_webContents);
  if (!window) {
    item.cancel();
    return;
  }

  void (async () => {
    const mp = await ensureMacosProgressModule();

    let progressId: string | null = null;
    const totalBytes = item.getTotalBytes();
    if (mp) {
      progressId = mp.createFileProgress(crdownloadPath, totalBytes > 0 ? totalBytes : 0, () => {
        debugPrint("DOWNLOADS", `Cancel requested from Finder for: ${suggestedFilename}`);
        item.cancel();
      });
      debugPrint("DOWNLOADS", `macOS progress created: ${progressId}`);
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
    const visibleCrdownloadPath = path.join(path.dirname(finalPath), crdownloadBasename);

    debugPrint("DOWNLOADS", `User chose final path: ${finalPath}`);
    debugPrint("DOWNLOADS", `  visible in-progress name: ${visibleCrdownloadPath}`);

    const metadata: DownloadMetadata = {
      crdownloadPath,
      finalPath,
      visibleCrdownloadPath,
      progressId,
      lastUpdate: Date.now(),
      lastBytes: 0,
      initialTotalBytes: totalBytes,
      mirrorSetup: false
    };
    activeDownloads.set(item, metadata);

    item.resume();
  })();

  item.on("updated", (_event, state) => {
    const meta = activeDownloads.get(item);
    if (!meta) return;

    if (state === "progressing" && !meta.mirrorSetup && fs.existsSync(meta.crdownloadPath)) {
      meta.mirrorSetup = true;
      const kind = mirrorCrdownloadToVisible(meta.crdownloadPath, meta.visibleCrdownloadPath);
      meta.mirrorKind = kind;
      if (kind === "moved") {
        meta.crdownloadPath = meta.visibleCrdownloadPath;
      }
      debugPrint("DOWNLOADS", `In-progress .crdownload at user path (${kind}): ${meta.visibleCrdownloadPath}`);

      if (macosProgress && meta.progressId && fs.existsSync(meta.visibleCrdownloadPath)) {
        macosProgress.updateFileProgressPath(meta.progressId, meta.visibleCrdownloadPath);
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

  item.once("done", (_event, state) => {
    const meta = activeDownloads.get(item);
    if (!meta) return;

    activeDownloads.delete(item);

    if (state === "completed") {
      debugPrint("DOWNLOADS", `Download completed: ${meta.crdownloadPath}`);

      if (macosProgress && meta.progressId) {
        macosProgress.completeFileProgress(meta.progressId);
      }

      if (meta.mirrorKind && meta.mirrorKind !== "moved") {
        removeMirrorIfNeeded(meta);
      }

      try {
        if (fs.existsSync(meta.finalPath)) {
          fs.unlinkSync(meta.finalPath);
        }

        fs.renameSync(meta.crdownloadPath, meta.finalPath);
        debugPrint("DOWNLOADS", `Moved to final path: ${meta.finalPath}`);
      } catch {
        try {
          fs.copyFileSync(meta.crdownloadPath, meta.finalPath);
          fs.unlinkSync(meta.crdownloadPath);
          debugPrint("DOWNLOADS", `Copied to final path: ${meta.finalPath}`);
        } catch (copyErr) {
          debugError("DOWNLOADS", `Failed to move download:`, copyErr);
        }
      }
    } else if (state === "cancelled") {
      debugPrint("DOWNLOADS", `Download cancelled: ${meta.crdownloadPath}`);

      if (macosProgress && meta.progressId) {
        macosProgress.cancelFileProgress(meta.progressId);
      }

      if (meta.mirrorKind && meta.mirrorKind !== "moved") {
        removeMirrorIfNeeded(meta);
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

      if (macosProgress && meta.progressId) {
        macosProgress.cancelFileProgress(meta.progressId);
      }

      if (meta.mirrorKind && meta.mirrorKind !== "moved") {
        removeMirrorIfNeeded(meta);
      }
    }
  });
}

export function registerDownloadHandler(session: Session): void {
  session.on("will-download", (_event, item, webContents) => {
    handleDownload(webContents, item);
  });

  debugPrint("DOWNLOADS", "Download handler registered for session");
}
