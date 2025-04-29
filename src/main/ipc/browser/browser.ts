import { browser } from "@/index";
import { ipcMain } from "electron";

ipcMain.on("browser:load-profile", async (event, profileId: string) => {
  await browser?.loadProfile(profileId);
});

ipcMain.on("browser:unload-profile", async (event, profileId: string) => {
  browser?.unloadProfile(profileId);
});

ipcMain.on("browser:create-window", async (event) => {
  browser?.createWindow();
});
