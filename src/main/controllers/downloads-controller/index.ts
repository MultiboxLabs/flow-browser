import { randomUUID } from "crypto";
import { app, session as electronSession, type DownloadItem, type Session, type WebContents } from "electron";
import path from "path";
import { FLOW_DATA_DIR } from "@/modules/paths";
import { debugError, debugPrint } from "@/modules/output";
import {
  getDownloadRecord,
  listDownloads as listPersistedDownloads,
  reconcileDownloadsOnStartup,
  updateDownloadRecord,
  upsertDownloadRecord
} from "@/saving/downloads";
import type { DownloadInsert, DownloadRow } from "@/saving/db/schema";
import { fireDownloadsChanged } from "@/ipc/browser/downloads";

type MacOSProgressModule = typeof import("./macos-progress");

const PROFILES_DIR = path.join(FLOW_DATA_DIR, "Profiles");
const DOWNLOAD_PROGRESS_PERSIST_INTERVAL_MS = 1000;

interface DownloadMetadata {
  downloadId: string;
  originProfileId: string | null;
  progressId: string | null;
  savePath: string | null;
  lastUpdate: number;
  lastBytes: number;
  initialTotalBytes: number;
  syncingProgress: boolean;
  lastPersistedAt: number;
}

interface ActiveDownload {
  item: DownloadItem;
  session: Session;
  meta: DownloadMetadata;
}

interface PendingResumeRequest {
  downloadId: string;
  savePath: string;
  lastUrl: string;
  autoResume: boolean;
}

class DownloadsController {
  private readonly activeDownloads = new WeakMap<DownloadItem, DownloadMetadata>();
  private readonly activeDownloadsById = new Map<string, ActiveDownload>();
  private readonly registeredSessions = new WeakSet<Session>();
  private readonly pendingResumeRequests = new WeakMap<Session, PendingResumeRequest[]>();

  private didInitializePersistence = false;
  private macosProgress: MacOSProgressModule | null = null;
  private macosProgressLoad: Promise<MacOSProgressModule | null> | null = null;

  public registerSession(session: Session): void {
    this.ensurePersistenceInitialized();

    if (this.registeredSessions.has(session)) {
      return;
    }

    session.on("will-download", (_event, item, webContents) => {
      this.handleWillDownload(session, item, webContents);
    });

    this.registeredSessions.add(session);
    debugPrint("DOWNLOADS", "Download handler registered for session");
  }

  public listDownloads(): DownloadRow[] {
    this.ensurePersistenceInitialized();
    return listPersistedDownloads();
  }

  public getDownload(downloadId: string): DownloadRow | undefined {
    this.ensurePersistenceInitialized();
    return getDownloadRecord(downloadId);
  }

  public pauseDownload(downloadId: string): boolean {
    this.ensurePersistenceInitialized();

    const active = this.activeDownloadsById.get(downloadId);
    if (!active) return false;

    try {
      if (!active.item.isPaused()) {
        active.item.pause();
      }

      this.persistDownloadSnapshot(active, "paused", true);
      debugPrint("DOWNLOADS", `Paused download ${downloadId}`);
      return true;
    } catch (err) {
      debugError("DOWNLOADS", `Failed to pause download ${downloadId}:`, err);
      return false;
    }
  }

  public resumeDownload(downloadId: string): boolean {
    this.ensurePersistenceInitialized();

    const active = this.activeDownloadsById.get(downloadId);
    if (active) {
      try {
        if (!active.item.isPaused() && active.item.getState() !== "interrupted") {
          return false;
        }
        if (active.item.getState() === "interrupted" && !active.item.canResume()) {
          return false;
        }

        active.item.resume();
        this.persistDownloadSnapshot(active, "progressing", true);
        debugPrint("DOWNLOADS", `Resumed active download ${downloadId}`);
        return true;
      } catch (err) {
        debugError("DOWNLOADS", `Failed to resume active download ${downloadId}:`, err);
        return false;
      }
    }

    const record = getDownloadRecord(downloadId);
    if (!record || !this.canRestoreDownload(record)) {
      return false;
    }

    try {
      const targetSession = this.getSessionForDownload(record.originProfileId);
      this.registerSession(targetSession);
      this.enqueuePendingResume(targetSession, {
        downloadId,
        savePath: record.savePath!,
        lastUrl: record.urlChain[record.urlChain.length - 1] ?? record.url,
        autoResume: true
      });

      targetSession.createInterruptedDownload({
        path: record.savePath!,
        urlChain: record.urlChain,
        mimeType: record.mimeType ?? undefined,
        offset: record.receivedBytes,
        length: record.totalBytes,
        lastModified: record.lastModified ?? undefined,
        eTag: record.eTag ?? undefined,
        startTime: Math.floor(record.startTime / 1000)
      });

      fireDownloadsChanged();
      debugPrint("DOWNLOADS", `Queued interrupted download restore for ${downloadId}`);
      return true;
    } catch (err) {
      debugError("DOWNLOADS", `Failed to recreate interrupted download ${downloadId}:`, err);
      return false;
    }
  }

  public cancelDownload(downloadId: string): boolean {
    this.ensurePersistenceInitialized();

    const active = this.activeDownloadsById.get(downloadId);
    if (active) {
      try {
        active.item.cancel();
        debugPrint("DOWNLOADS", `Cancelled active download ${downloadId}`);
        return true;
      } catch (err) {
        debugError("DOWNLOADS", `Failed to cancel active download ${downloadId}:`, err);
        return false;
      }
    }

    const record = getDownloadRecord(downloadId);
    if (!record || (record.state !== "interrupted" && record.state !== "paused")) {
      return false;
    }

    updateDownloadRecord(downloadId, {
      state: "cancelled",
      canResume: false,
      endTime: Date.now()
    });
    fireDownloadsChanged();
    debugPrint("DOWNLOADS", `Marked inactive download ${downloadId} as cancelled`);
    return true;
  }

  private ensurePersistenceInitialized(): void {
    if (this.didInitializePersistence) return;
    reconcileDownloadsOnStartup();
    this.didInitializePersistence = true;
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

  private handleWillDownload(session: Session, item: DownloadItem, webContents?: WebContents): void {
    const pendingResume = this.consumePendingResume(session, item);
    const existingRecord = pendingResume ? getDownloadRecord(pendingResume.downloadId) : undefined;

    const downloadId = pendingResume?.downloadId ?? randomUUID();
    const suggestedFilename = item.getFilename();
    const defaultPath = path.join(app.getPath("downloads"), suggestedFilename);
    const savePath = this.getSavePath(item);
    const originProfileId = existingRecord?.originProfileId ?? this.resolveOriginProfileId(session, webContents);
    const now = Date.now();

    if (!pendingResume) {
      item.setSaveDialogOptions({
        defaultPath,
        properties: ["createDirectory", "showOverwriteConfirmation"]
      });
    }

    const metadata: DownloadMetadata = {
      downloadId,
      originProfileId,
      progressId: null,
      savePath,
      lastUpdate: now,
      lastBytes: item.getReceivedBytes(),
      initialTotalBytes: item.getTotalBytes(),
      syncingProgress: false,
      lastPersistedAt: 0
    };

    const activeDownload: ActiveDownload = { item, session, meta: metadata };

    this.activeDownloads.set(item, metadata);
    this.activeDownloadsById.set(downloadId, activeDownload);

    upsertDownloadRecord(this.buildDownloadInsert(item, metadata, existingRecord));
    fireDownloadsChanged();

    debugPrint("DOWNLOADS", `Download requested: ${suggestedFilename} (${downloadId})`);

    this.queueProgressSync(item, metadata);

    item.on("updated", (_event, state) => {
      const currentMeta = this.activeDownloads.get(item);
      if (!currentMeta) return;

      const current = this.activeDownloadsById.get(currentMeta.downloadId);
      if (!current) return;

      this.queueProgressSync(item, currentMeta);

      if (state === "progressing") {
        this.updateMacProgress(currentMeta, item);
      } else if (state === "interrupted") {
        debugPrint("DOWNLOADS", `Download interrupted: ${item.getFilename()} (${currentMeta.downloadId})`);
      }

      const persistedState = this.getPersistedState(item, state);
      this.persistDownloadSnapshot(current, persistedState, persistedState !== "progressing");
    });

    item.once("done", (_event, state) => {
      const currentMeta = this.activeDownloads.get(item);
      if (!currentMeta) return;

      const current = this.activeDownloadsById.get(currentMeta.downloadId);
      this.activeDownloads.delete(item);
      this.activeDownloadsById.delete(currentMeta.downloadId);

      if (current) {
        void this.handleDone(current, state);
      }
    });

    if (pendingResume?.autoResume) {
      queueMicrotask(() => {
        try {
          item.resume();
          this.persistDownloadSnapshot(activeDownload, "progressing", true);
          debugPrint("DOWNLOADS", `Auto-resumed interrupted download ${downloadId}`);
        } catch (err) {
          debugError("DOWNLOADS", `Failed to auto-resume interrupted download ${downloadId}:`, err);
        }
      });
    }
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

  private async handleDone(active: ActiveDownload, state: "completed" | "cancelled" | "interrupted"): Promise<void> {
    await this.syncMacProgress(active.item, active.meta);

    if (this.macosProgress && active.meta.progressId) {
      if (state === "completed") {
        this.macosProgress.completeFileProgress(active.meta.progressId, active.item.getReceivedBytes());
      } else {
        this.macosProgress.cancelFileProgress(active.meta.progressId);
      }
    }

    this.persistDownloadSnapshot(active, state, true);
    fireDownloadsChanged();
    debugPrint("DOWNLOADS", `Download ${state}: ${this.getSavePath(active.item) ?? active.item.getFilename()}`);
  }

  private buildDownloadInsert(
    item: DownloadItem,
    meta: DownloadMetadata,
    existingRecord?: DownloadRow
  ): DownloadInsert {
    const now = Date.now();
    const urlChain = this.getUrlChain(item);

    return {
      id: meta.downloadId,
      originProfileId: meta.originProfileId,
      url: item.getURL(),
      urlChain,
      suggestedFilename: item.getFilename(),
      savePath: meta.savePath,
      mimeType: this.emptyToNull(item.getMimeType()) ?? existingRecord?.mimeType ?? null,
      state: this.getPersistedState(item),
      receivedBytes: item.getReceivedBytes(),
      totalBytes: item.getTotalBytes(),
      startTime: existingRecord?.startTime ?? this.getDownloadStartTimeMs(item, now),
      endTime: null,
      eTag: this.emptyToNull(item.getETag()) ?? existingRecord?.eTag ?? null,
      lastModified: this.emptyToNull(item.getLastModifiedTime()) ?? existingRecord?.lastModified ?? null,
      canResume: item.canResume(),
      createdAt: existingRecord?.createdAt ?? now,
      updatedAt: now
    };
  }

  private persistDownloadSnapshot(
    active: ActiveDownload,
    explicitState?: DownloadInsert["state"],
    force: boolean = false
  ): void {
    const now = Date.now();
    const { item, meta } = active;
    const state = explicitState ?? this.getPersistedState(item);

    if (!force && state === "progressing" && now - meta.lastPersistedAt < DOWNLOAD_PROGRESS_PERSIST_INTERVAL_MS) {
      return;
    }

    const savePath = this.getSavePath(item);
    if (savePath) {
      meta.savePath = savePath;
    }

    updateDownloadRecord(meta.downloadId, {
      originProfileId: meta.originProfileId,
      url: item.getURL(),
      urlChain: this.getUrlChain(item),
      suggestedFilename: item.getFilename(),
      savePath: meta.savePath,
      mimeType: this.emptyToNull(item.getMimeType()),
      state,
      receivedBytes: item.getReceivedBytes(),
      totalBytes: item.getTotalBytes(),
      startTime: this.getDownloadStartTimeMs(item),
      endTime: this.shouldSetEndTime(state, item.canResume()) ? this.getDownloadEndTimeMs(item, now) : null,
      eTag: this.emptyToNull(item.getETag()),
      lastModified: this.emptyToNull(item.getLastModifiedTime()),
      canResume: item.canResume(),
      updatedAt: now
    });

    meta.lastPersistedAt = now;
    fireDownloadsChanged();
  }

  private getPersistedState(
    item: DownloadItem,
    stateHint?: "progressing" | "interrupted" | "completed" | "cancelled"
  ): DownloadInsert["state"] {
    if (item.isPaused()) return "paused";
    return stateHint ?? item.getState();
  }

  private resolveOriginProfileId(session: Session, webContents?: WebContents): string | null {
    if (webContents) {
      const fromWebContentsSession = this.getProfileIdFromStoragePath(webContents.session.getStoragePath());
      if (fromWebContentsSession) return fromWebContentsSession;
    }

    return this.getProfileIdFromStoragePath(session.getStoragePath());
  }

  private getProfileIdFromStoragePath(storagePath: string | null): string | null {
    if (!storagePath) return null;

    const relativePath = path.relative(PROFILES_DIR, storagePath);
    if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      return null;
    }

    const [profileId] = relativePath.split(path.sep);
    return profileId || null;
  }

  private getSessionForDownload(originProfileId: string | null): Session {
    if (!originProfileId) {
      return electronSession.defaultSession;
    }

    return electronSession.fromPath(path.join(PROFILES_DIR, originProfileId));
  }

  private canRestoreDownload(record: DownloadRow): boolean {
    return !!record.canResume && !!record.savePath && record.urlChain.length > 0 && record.totalBytes > 0;
  }

  private enqueuePendingResume(session: Session, request: PendingResumeRequest): void {
    const queue = this.pendingResumeRequests.get(session) ?? [];
    queue.push(request);
    this.pendingResumeRequests.set(session, queue);
  }

  private consumePendingResume(session: Session, item: DownloadItem): PendingResumeRequest | undefined {
    const queue = this.pendingResumeRequests.get(session);
    if (!queue || queue.length === 0) return undefined;

    const savePath = this.getSavePath(item);
    const lastUrl = this.getUrlChain(item).at(-1) ?? item.getURL();

    const matchIndex = queue.findIndex((candidate) => {
      if (savePath && candidate.savePath !== savePath) return false;
      if (lastUrl && candidate.lastUrl !== lastUrl) return false;
      return true;
    });

    if (matchIndex >= 0) {
      const [match] = queue.splice(matchIndex, 1);
      if (queue.length === 0) {
        this.pendingResumeRequests.delete(session);
      }
      return match;
    }

    if (queue.length === 1 && item.getState() === "interrupted") {
      const [fallback] = queue.splice(0, 1);
      this.pendingResumeRequests.delete(session);
      return fallback;
    }

    return undefined;
  }

  private getUrlChain(item: DownloadItem): string[] {
    const chain = item.getURLChain();
    return chain.length > 0 ? chain : [item.getURL()];
  }

  private shouldSetEndTime(state: DownloadInsert["state"], canResume: boolean): boolean {
    if (state === "completed" || state === "cancelled") return true;
    if (state === "interrupted" && !canResume) return true;
    return false;
  }

  private getDownloadStartTimeMs(item: DownloadItem, fallback: number = Date.now()): number {
    const startTimeSeconds = item.getStartTime();
    if (startTimeSeconds > 0) {
      return Math.round(startTimeSeconds * 1000);
    }
    return fallback;
  }

  private getDownloadEndTimeMs(item: DownloadItem, fallback: number = Date.now()): number {
    const endTimeSeconds = item.getEndTime();
    if (endTimeSeconds > 0) {
      return Math.round(endTimeSeconds * 1000);
    }
    return fallback;
  }

  private emptyToNull(value: string): string | null {
    return value.trim() ? value : null;
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
