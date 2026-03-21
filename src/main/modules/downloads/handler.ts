/**
 * Chrome-like download handler with .crdownload temporary files.
 *
 * Paths (same random id for one download):
 * - **Hidden temp** — `Downloads/.Unconfirmed {id}.crdownload` (leading dot = hidden in Finder).
 *   Electron must get this path synchronously in `will-download`; we pause until the user picks
 *   a final location, then resume.
 * - **Visible in-progress** — `dirname(final) / Unconfirmed {id}.crdownload` (no leading dot).
 *   Once the temp file exists, we move or mirror it here so the user sees progress next to their
 *   chosen save name.
 * - **Final** — path from the save dialog; we rename the completed `.crdownload` here.
 *
 * Flow:
 * 1. `setSavePath` (hidden) + `pause` so no bytes run before metadata exists.
 * 2. macOS: `NSProgress` on the hidden path, then save dialog.
 * 3. On confirm: `resume`; on first `progressing` event with a real file, move/mirror to visible.
 * 4. On `done`: tear down mirror if needed, then rename (or copy+delete) to the final name.
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
 * How we got the visible `.crdownload` beside the user’s save location.
 * - `moved` — single file on disk; `crdownloadPath` is updated to match `visibleCrdownloadPath`.
 * - `hardlink` / `symlink` — two paths point at the same bytes (or symlink target); we unlink
 *   `visibleCrdownloadPath` before renaming the hidden file to the final name.
 * - `placeholder` — decoy empty file only; real data stays under `crdownloadPath` (hidden).
 * - `failed` — could not create anything visible; download may still complete to hidden path.
 */
type MirrorKind = "moved" | "hardlink" | "symlink" | "placeholder" | "failed";

interface DownloadMetadata {
  /** Where the bytes live *right now* (hidden temp until a successful `moved`, then visible). */
  crdownloadPath: string;
  finalPath: string;
  visibleCrdownloadPath: string;
  progressId: string | null;
  lastUpdate: number;
  lastBytes: number;
  initialTotalBytes: number;
  /** Ensures move/mirror runs once, on first `progressing` tick after the temp file exists. */
  mirrorSetup: boolean;
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

/**
 * Put the in-progress download next to the user’s chosen file as a visible `Unconfirmed ….crdownload`.
 * Tries cheapest/best first; `rename` fails across volumes (`EXDEV`), so we fall back to links.
 */
function mirrorCrdownloadToVisible(hiddenPath: string, visiblePath: string): MirrorKind {
  // Collision: we need this exact name; existing file is removed (same as Chrome-style temp behavior).
  if (fs.existsSync(visiblePath)) {
    try {
      fs.unlinkSync(visiblePath);
    } catch {
      /* ignore */
    }
  }

  // Same volume: one inode moves to `visiblePath`; open FD from Chromium keeps working.
  try {
    fs.renameSync(hiddenPath, visiblePath);
    return "moved";
  } catch {
    /* continue */
  }

  // Same volume, second name for the same inode (Finder shows growing size on both).
  try {
    fs.linkSync(hiddenPath, visiblePath);
    return "hardlink";
  } catch {
    /* continue */
  }

  // Cross-volume: symlink to absolute hidden path so Finder can still open the real file.
  try {
    fs.symlinkSync(hiddenPath, visiblePath);
    return "symlink";
  } catch {
    /* continue */
  }

  // Last resort: empty decoy at visible path; NSProgress still tracks the real file under hidden.
  try {
    fs.writeFileSync(visiblePath, "");
    return "placeholder";
  } catch (err) {
    debugError("DOWNLOADS", "Could not mirror .crdownload to user path:", err);
    return "failed";
  }
}

/** Drops the extra visible path when it is not the sole copy (`moved`). Skips directories. */
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

/** Main `will-download` handler: sync setup, async dialog, then event-driven move + completion. */
export function handleDownload(_webContents: WebContents, item: DownloadItem): void {
  const suggestedFilename = item.getFilename();
  const downloadsDir = app.getPath("downloads");
  const defaultPath = path.join(downloadsDir, suggestedFilename);

  const crdownloadBasename = generateCrdownloadBasename();
  const crdownloadPath = hiddenCrdownloadPathInDownloads(downloadsDir, crdownloadBasename);

  debugPrint("DOWNLOADS", `Download requested: ${suggestedFilename}`);
  debugPrint("DOWNLOADS", `  hidden temp: ${crdownloadPath}`);

  // Electron requires `setSavePath` before this handler returns; `pause` avoids racing `updated`
  // before `activeDownloads` is populated when the dialog resolves.
  item.setSavePath(crdownloadPath);
  item.pause();

  const window = browserWindowsController.getWindowFromWebContents(_webContents);
  if (!window) {
    item.cancel();
    return;
  }

  // Dialog + NSProgress cannot block the synchronous `will-download` return path.
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
    // Same folder as the eventual save, Chrome-style visible name (not the hidden dotfile in Downloads).
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
    // No meta until the user confirms the save dialog; ignore early events while paused.
    if (!meta) return;

    // First moment the temp file exists: relocate or mirror so Finder shows something sensible.
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

  item.once("done", (_event, state) => {
    const meta = activeDownloads.get(item);
    if (!meta) return;

    activeDownloads.delete(item);

    if (state === "completed") {
      debugPrint("DOWNLOADS", `Download completed: ${meta.crdownloadPath}`);

      if (macosProgress && meta.progressId) {
        macosProgress.completeFileProgress(meta.progressId);
      }

      // `moved`: visible path *is* the download; unlinking it would delete the file. For links /
      // placeholder, remove the extra visible entry first, then rename the real temp to `finalPath`.
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
        // e.g. cross-device rename
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

      // Same rule as completed: only strip a second path; `moved` means delete via `crdownloadPath` only.
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

      // Leave partial files on disk for recovery; only remove an extra visible mirror if present.
      if (meta.mirrorKind && meta.mirrorKind !== "moved") {
        removeMirrorIfNeeded(meta);
      }
    }
  });
}

export function registerDownloadHandler(session: Session): void {
  session.on("will-download", (_event, item, webContents) => {
    // Register per item inside `handleDownload` (`on` / `once` on `DownloadItem`).
    handleDownload(webContents, item);
  });

  debugPrint("DOWNLOADS", "Download handler registered for session");
}
