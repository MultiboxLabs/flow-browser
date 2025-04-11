import { app } from "electron";
import { ipcMain } from "electron";

ipcMain.handle("app:get-info", async () => {
  return {
    version: app.getVersion(),
    packaged: app.isPackaged
  };
});
