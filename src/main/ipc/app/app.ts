import { isDefaultBrowser, setDefaultBrowser } from "@/modules/default-browser";
import { app, clipboard } from "electron";
import { ipcMain } from "electron";

ipcMain.handle("app:get-info", async () => {
  return {
    version: app.getVersion(),
    packaged: app.isPackaged
  };
});

ipcMain.on("app:write-text-to-clipboard", (_event, text: string) => {
  clipboard.writeText(text);
});

ipcMain.handle("app:set-default-browser", async () => {
  return await setDefaultBrowser();
});

ipcMain.handle("app:get-default-browser", async () => {
  return isDefaultBrowser();
});
