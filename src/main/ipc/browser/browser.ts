import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { ipcMain } from "electron";
import { createIncognitoWindow } from "@/modules/incognito/windows";

ipcMain.on("browser:load-profile", async (_event, profileId: string) => {
  await loadedProfilesController.load(profileId);
});

ipcMain.on("browser:unload-profile", async (_event, profileId: string) => {
  loadedProfilesController.unload(profileId);
});

ipcMain.on("browser:create-window", async () => {
  browserWindowsController.create();
});

ipcMain.on("browser:create-incognito-window", async () => {
  await createIncognitoWindow();
});
