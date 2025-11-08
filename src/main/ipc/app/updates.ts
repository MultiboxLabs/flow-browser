import { autoUpdateController } from "@/controllers/auto-update-controller";
import { sendMessageToListeners } from "@/ipc/listeners-manager";
import { ipcMain } from "electron";
import { UpdateStatus } from "~/types/updates";

ipcMain.handle("updates:is-auto-update-supported", () => {
  return autoUpdateController.isAutoUpdateSupported(process.platform);
});

ipcMain.handle("updates:get-update-status", () => {
  return autoUpdateController.getUpdateStatus();
});

ipcMain.handle("updates:check-for-updates", async () => {
  try {
    const result = await autoUpdateController.checkForUpdates();
    if (result?.isUpdateAvailable) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
});

ipcMain.handle("updates:download-update", () => {
  return autoUpdateController.downloadUpdate();
});

ipcMain.handle("updates:install-update", () => {
  return autoUpdateController.installUpdate();
});

export function fireUpdateStatusChanged(updateStatus: UpdateStatus) {
  sendMessageToListeners("updates:on-update-status-changed", updateStatus);
}
autoUpdateController.on("status-changed", () => {
  fireUpdateStatusChanged(autoUpdateController.getUpdateStatus());
});
