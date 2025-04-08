import { settings } from "@/settings/main";
import { ipcMain } from "electron";

ipcMain.on("settings:open", () => {
  settings.show();
});

ipcMain.on("settings:close", () => {
  settings.hide();
});
