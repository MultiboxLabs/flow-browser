import { browser } from "@/browser";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { ipcMain } from "electron";

ipcMain.on("browser:load-profile", async (_event, profileId: string) => {
  await browser?.loadProfile(profileId);
});

ipcMain.on("browser:unload-profile", async (_event, profileId: string) => {
  browser?.unloadProfile(profileId);
});

ipcMain.on("browser:create-window", async () => {
  browserWindowsController.create();
});
