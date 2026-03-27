import fs from "node:fs";
import { ipcMain, shell } from "electron";
import { downloadsController } from "@/controllers/downloads-controller";
import { deleteDownloadRecord, getDownloadRecord, listDownloads } from "@/saving/downloads";

ipcMain.handle("downloads:list", () => {
  return downloadsController.listDownloads();
});

ipcMain.handle("downloads:get", (_event, downloadId: string) => {
  return downloadsController.getDownload(downloadId);
});

ipcMain.handle("downloads:pause", (_event, downloadId: string) => {
  return downloadsController.pauseDownload(downloadId);
});

ipcMain.handle("downloads:resume", (_event, downloadId: string) => {
  return downloadsController.resumeDownload(downloadId);
});

ipcMain.handle("downloads:cancel", (_event, downloadId: string) => {
  return downloadsController.cancelDownload(downloadId);
});

ipcMain.handle("downloads:show-in-folder", (_event, downloadId: string) => {
  const record = getDownloadRecord(downloadId);
  if (!record?.savePath) return false;
  shell.showItemInFolder(record.savePath);
  return true;
});

ipcMain.handle("downloads:open-file", (_event, downloadId: string) => {
  const record = getDownloadRecord(downloadId);
  if (!record?.savePath || record.state !== "completed") return false;
  shell.openPath(record.savePath);
  return true;
});

ipcMain.handle("downloads:remove-record", (_event, downloadId: string) => {
  return deleteDownloadRecord(downloadId);
});

ipcMain.handle("downloads:clear-completed", () => {
  const downloads = listDownloads();
  for (const dl of downloads) {
    if (dl.state === "completed" || dl.state === "cancelled") {
      deleteDownloadRecord(dl.id);
    }
  }
});

ipcMain.handle("downloads:check-files-exist", (_event, downloadIds: string[]) => {
  const result: Record<string, boolean> = {};
  for (const id of downloadIds) {
    const record = getDownloadRecord(id);
    if (!record?.savePath) {
      result[id] = false;
    } else {
      result[id] = fs.existsSync(record.savePath);
    }
  }
  return result;
});
