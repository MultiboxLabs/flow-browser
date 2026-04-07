import fs from "node:fs";
import { ipcMain, shell } from "electron";
import { downloadsController } from "@/controllers/downloads-controller";
import { deleteDownloadRecord, getDownloadRecord, listDownloads } from "@/saving/downloads";
import { sendMessageToListeners } from "@/ipc/listeners-manager";

export function fireDownloadsChanged() {
  sendMessageToListeners("downloads:on-changed");
}

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
  const ok = deleteDownloadRecord(downloadId);
  if (ok) fireDownloadsChanged();
  return ok;
});

ipcMain.handle("downloads:clear-completed", () => {
  const downloads = listDownloads();
  let changed = false;
  for (const dl of downloads) {
    if (dl.state === "completed" || dl.state === "cancelled") {
      deleteDownloadRecord(dl.id);
      changed = true;
    }
  }
  if (changed) fireDownloadsChanged();
});

ipcMain.handle("downloads:check-files-exist", async (_event, downloadIds: string[]) => {
  const checks = await Promise.all(
    downloadIds.map(async (id) => {
      const record = getDownloadRecord(id);
      if (!record?.savePath) return [id, false] as const;
      try {
        await fs.promises.access(record.savePath);
        return [id, true] as const;
      } catch {
        return [id, false] as const;
      }
    })
  );
  return Object.fromEntries(checks);
});
