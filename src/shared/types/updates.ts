import type { UpdateInfo, ProgressInfo } from "electron-updater";

export interface UpdateStatus {
  availableUpdate: UpdateInfo | null;
  downloadProgress: ProgressInfo | null;
  updateDownloaded: boolean;
}
