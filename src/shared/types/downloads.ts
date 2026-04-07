export const DOWNLOAD_STATES = ["progressing", "paused", "interrupted", "completed", "cancelled"] as const;

export type DownloadState = (typeof DOWNLOAD_STATES)[number];

export interface DownloadRecord {
  id: string;
  originProfileId: string | null;
  url: string;
  urlChain: string[];
  suggestedFilename: string;
  savePath: string | null;
  mimeType: string | null;
  state: DownloadState;
  receivedBytes: number;
  totalBytes: number;
  startTime: number;
  endTime: number | null;
  eTag: string | null;
  lastModified: string | null;
  canResume: boolean;
  createdAt: number;
  updatedAt: number;
}
