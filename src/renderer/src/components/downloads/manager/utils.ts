import type { DownloadRecord, DownloadState } from "~/types/downloads";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function simplifyUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function filenameFromRecord(record: DownloadRecord): string {
  if (record.savePath) {
    const parts = record.savePath.split(/[/\\]/);
    return parts[parts.length - 1] || record.suggestedFilename;
  }
  return record.suggestedFilename;
}

export function isActive(state: DownloadState): boolean {
  return state === "progressing" || state === "paused";
}

export function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function daySectionLabel(ts: number): string {
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t1 = t0 - 86400000;
  if (ts >= t0) return "Today";
  if (ts >= t1) return "Yesterday";
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export type DayGroup = { dayStart: number; label: string; items: DownloadRecord[] };

export function groupByDay(downloads: DownloadRecord[]): DayGroup[] {
  const map = new Map<number, DownloadRecord[]>();
  for (const dl of downloads) {
    const key = startOfLocalDay(dl.startTime);
    const list = map.get(key) ?? [];
    list.push(dl);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([dayStart, items]) => ({
      dayStart,
      label: daySectionLabel(dayStart),
      items: items.sort((a, b) => b.startTime - a.startTime)
    }));
}
