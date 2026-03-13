import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { ipcMain } from "electron";
import { createIncognitoWindow } from "@/modules/incognito/windows";
import { FLAGS } from "@/modules/flags";

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
  if (!FLAGS.INCOGNITO_ENABLED) return;
  try {
    await createIncognitoWindow();
  } catch (error) {
    console.error("[IPC] Failed to create incognito window:", error);
  }
});
