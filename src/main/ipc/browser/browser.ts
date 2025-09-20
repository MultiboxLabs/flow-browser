import { browser } from "@/browser";
import { ipcMain } from "electron";

ipcMain.on("browser:load-profile", async (_event, profileId: string) => {
  await browser?.loadProfile(profileId);
});

ipcMain.on("browser:unload-profile", async (_event, profileId: string) => {
  browser?.unloadProfile(profileId);
});

ipcMain.on("browser:create-window", async () => {
  browser?.createWindow();
});
