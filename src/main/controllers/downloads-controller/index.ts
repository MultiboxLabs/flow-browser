import { app, type DownloadItem, type Session } from "electron";
import path from "path";
import { debugError, debugPrint } from "@/modules/output";

type MacOSProgressModule = typeof import("./macos-progress");

interface DownloadMetadata {
  progressId: string | null;
  savePath: string | null;
  lastUpdate: number;
  lastBytes: number;
  initialTotalBytes: number;
  syncingProgress: boolean;
}

class DownloadsController {
  private readonly activeDownloads = new WeakMap<DownloadItem, DownloadMetadata>();
  private readonly registeredSessions = new WeakSet<Session>();
  private macosProgress: MacOSProgressModule | null = null;
  private macosProgressLoad: Promise<MacOSProgressModule | null> | null = null;

  public registerSession(session: Session): void {
    if (this.registeredSessions.has(session)) {
      return;
    }

    session.on("will-download", (_event, item) => {
      this.handleWillDownload(item);
    });

    this.registeredSessions.add(session);
    debugPrint("DOWNLOADS", "Download handler registered for session");
  }

  private async ensureMacosProgressModule(): Promise<MacOSProgressModule | null> {
    if (process.platform !== "darwin") return null;
    if (this.macosProgress) return this.macosProgress;

    if (!this.macosProgressLoad) {
      this.macosProgressLoad = import("./macos-progress")
        .then((module) => {
          this.macosProgress = module;
          return module;
        })
        .catch((err) => {
          debugError("DOWNLOADS", "Failed to load macOS progress module:", err);
          return null;
        });
    }

    return this.macosProgressLoad;
  }

  private handleWillDownload(item: DownloadItem): void {
    const suggestedFilename = item.getFilename();
    const defaultPath = path.join(app.getPath("downloads"), suggestedFilename);

    item.setSaveDialogOptions({
      defaultPath,
      properties: ["createDirectory", "showOverwriteConfirmation"]
    });

    const metadata: DownloadMetadata = {
      progressId: null,
      savePath: null,
      lastUpdate: Date.now(),
      lastBytes: 0,
      initialTotalBytes: item.getTotalBytes(),
      syncingProgress: false
    };

    this.activeDownloads.set(item, metadata);

    debugPrint("DOWNLOADS", `Download requested: ${suggestedFilename}`);

    this.queueProgressSync(item, metadata);

    item.on("updated", (_event, state) => {
      const current = this.activeDownloads.get(item);
      if (!current) return;

      this.queueProgressSync(item, current);

      if (state === "progressing") {
        this.updateMacProgress(current, item);
      } else if (state === "interrupted") {
        debugPrint("DOWNLOADS", `Download interrupted: ${item.getFilename()}`);
      }
    });

    item.once("done", (_event, state) => {
      const current = this.activeDownloads.get(item);
      if (!current) return;

      this.activeDownloads.delete(item);
      void this.handleDone(item, current, state);
    });
  }

  private queueProgressSync(item: DownloadItem, meta: DownloadMetadata): void {
    if (meta.syncingProgress) return;

    meta.syncingProgress = true;
    void this.syncMacProgress(item, meta).finally(() => {
      meta.syncingProgress = false;
    });
  }

  private async syncMacProgress(item: DownloadItem, meta: DownloadMetadata): Promise<void> {
    const mp = await this.ensureMacosProgressModule();
    if (!mp) return;

    const savePath = this.getSavePath(item);
    if (!savePath) return;

    if (!meta.progressId) {
      meta.savePath = savePath;
      meta.initialTotalBytes = item.getTotalBytes();
      meta.progressId = mp.createFileProgress(savePath, meta.initialTotalBytes, () => {
        debugPrint("DOWNLOADS", `Cancel requested from Finder for: ${item.getFilename()}`);
        item.cancel();
      });
      return;
    }

    if (meta.savePath && meta.savePath !== savePath) {
      const nextProgressId = mp.recreateFileProgressAtPath(meta.progressId, savePath, () => {
        debugPrint("DOWNLOADS", `Cancel requested from Finder for: ${item.getFilename()}`);
        item.cancel();
      });

      if (nextProgressId) {
        meta.progressId = nextProgressId;
      }
      meta.savePath = savePath;
    }
  }

  private updateMacProgress(meta: DownloadMetadata, item: DownloadItem): void {
    if (!this.macosProgress || !meta.progressId) return;

    const receivedBytes = item.getReceivedBytes();
    const totalBytes = item.getTotalBytes();

    this.macosProgress.updateFileProgress(meta.progressId, receivedBytes);

    if (totalBytes > 0 && totalBytes !== meta.initialTotalBytes) {
      this.macosProgress.updateFileProgressTotal(meta.progressId, totalBytes);
      meta.initialTotalBytes = totalBytes;
    }

    const now = Date.now();
    const timeDelta = (now - meta.lastUpdate) / 1000;

    if (timeDelta >= 0.5) {
      const bytesDelta = receivedBytes - meta.lastBytes;
      const bytesPerSecond = bytesDelta / timeDelta;

      this.macosProgress.updateFileProgressThroughput(meta.progressId, bytesPerSecond);

      if (bytesPerSecond > 0 && totalBytes > 0) {
        const remainingBytes = totalBytes - receivedBytes;
        const secondsRemaining = remainingBytes / bytesPerSecond;
        this.macosProgress.updateFileProgressEstimatedTime(meta.progressId, secondsRemaining);
      }

      meta.lastUpdate = now;
      meta.lastBytes = receivedBytes;
    }
  }

  private async handleDone(
    item: DownloadItem,
    meta: DownloadMetadata,
    state: "completed" | "cancelled" | "interrupted"
  ): Promise<void> {
    await this.syncMacProgress(item, meta);

    if (!this.macosProgress || !meta.progressId) {
      debugPrint("DOWNLOADS", `Download ${state}: ${item.getFilename()}`);
      return;
    }

    if (state === "completed") {
      this.macosProgress.completeFileProgress(meta.progressId, item.getReceivedBytes());
    } else {
      this.macosProgress.cancelFileProgress(meta.progressId);
    }

    debugPrint("DOWNLOADS", `Download ${state}: ${this.getSavePath(item) ?? item.getFilename()}`);
  }

  private getSavePath(item: DownloadItem): string | null {
    try {
      const savePath = item.getSavePath();
      return savePath || null;
    } catch {
      return null;
    }
  }
}

export const downloadsController = new DownloadsController();
