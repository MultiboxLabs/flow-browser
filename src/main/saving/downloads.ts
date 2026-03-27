import { desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/saving/db";
import type { DownloadInsert, DownloadRow } from "@/saving/db/schema";
import type { DownloadState } from "~/types/downloads";

type DownloadRecordUpdate = Partial<Omit<DownloadInsert, "id" | "createdAt">>;

const IN_FLIGHT_DOWNLOAD_STATES: DownloadState[] = ["progressing", "paused"];

function buildUpsertSet(record: DownloadInsert): Omit<DownloadInsert, "id" | "createdAt"> {
  return {
    originProfileId: record.originProfileId,
    url: record.url,
    urlChain: record.urlChain,
    suggestedFilename: record.suggestedFilename,
    savePath: record.savePath,
    mimeType: record.mimeType,
    state: record.state,
    receivedBytes: record.receivedBytes,
    totalBytes: record.totalBytes,
    startTime: record.startTime,
    endTime: record.endTime,
    eTag: record.eTag,
    lastModified: record.lastModified,
    canResume: record.canResume,
    updatedAt: record.updatedAt
  };
}

export function upsertDownloadRecord(record: DownloadInsert): void {
  getDb()
    .insert(schema.downloads)
    .values(record)
    .onConflictDoUpdate({
      target: schema.downloads.id,
      set: buildUpsertSet(record)
    })
    .run();
}

export function updateDownloadRecord(downloadId: string, patch: DownloadRecordUpdate): void {
  if (Object.keys(patch).length === 0) return;

  getDb()
    .update(schema.downloads)
    .set({
      ...patch,
      updatedAt: patch.updatedAt ?? Date.now()
    })
    .where(eq(schema.downloads.id, downloadId))
    .run();
}

export function getDownloadRecord(downloadId: string): DownloadRow | undefined {
  return getDb().select().from(schema.downloads).where(eq(schema.downloads.id, downloadId)).get();
}

export function listDownloads(): DownloadRow[] {
  return getDb().select().from(schema.downloads).orderBy(desc(schema.downloads.updatedAt)).all();
}

export function deleteDownloadRecord(downloadId: string): boolean {
  const result = getDb().delete(schema.downloads).where(eq(schema.downloads.id, downloadId)).run();
  return result.changes > 0;
}

export function reconcileDownloadsOnStartup(): void {
  getDb()
    .update(schema.downloads)
    .set({
      state: "interrupted",
      updatedAt: Date.now()
    })
    .where(inArray(schema.downloads.state, IN_FLIGHT_DOWNLOAD_STATES))
    .run();
}
