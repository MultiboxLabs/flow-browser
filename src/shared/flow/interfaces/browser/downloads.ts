import type { IPCListener } from "~/flow/types";
import type { DownloadRecord } from "~/types/downloads";

export interface FlowDownloadsAPI {
  list: () => Promise<DownloadRecord[]>;
  get: (downloadId: string) => Promise<DownloadRecord | undefined>;
  pause: (downloadId: string) => Promise<boolean>;
  resume: (downloadId: string) => Promise<boolean>;
  cancel: (downloadId: string) => Promise<boolean>;
  showInFolder: (downloadId: string) => Promise<boolean>;
  openFile: (downloadId: string) => Promise<boolean>;
  removeRecord: (downloadId: string) => Promise<boolean>;
  clearCompleted: () => Promise<void>;
  checkFilesExist: (downloadIds: string[]) => Promise<Record<string, boolean>>;
  onChanged: IPCListener<[]>;
}
