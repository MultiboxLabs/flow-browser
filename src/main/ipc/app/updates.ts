import { sendMessageToListeners } from "@/ipc/listeners-manager";
import {
  isAutoUpdateSupported,
  getUpdateStatus,
  checkForUpdates,
  downloadUpdate,
  installUpdate
} from "@/modules/auto-update";
import { ipcMain } from "electron";
import { UpdateStatus } from "~/types/updates";

ipcMain.handle("updates:is-auto-update-supported", () => {
  return isAutoUpdateSupported(process.platform);
});

ipcMain.handle("updates:get-update-status", () => {
  return getUpdateStatus();
});

ipcMain.handle("updates:check-for-updates", async () => {
  try {
    const result = await checkForUpdates();
    if (result?.isUpdateAvailable) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
});

ipcMain.handle("updates:download-update", () => {
  return downloadUpdate();
});

ipcMain.handle("updates:install-update", () => {
  return installUpdate();
});

export function fireUpdateStatusChanged(updateStatus: UpdateStatus) {
  sendMessageToListeners("updates:on-update-status-changed", updateStatus);
}
