import { profilesController, ProfileData } from "@/controllers/profiles-controller";
import { ipcMain } from "electron";
import { spacesController } from "@/controllers/spaces-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";

ipcMain.handle("profiles:get-all", async () => {
  return await profilesController.getAll();
});

ipcMain.handle("profiles:create", async (_event, profileName: string) => {
  return await profilesController.create(profileName);
});

ipcMain.handle("profiles:update", async (_event, profileId: string, profileData: Partial<ProfileData>) => {
  console.log("Updating profile:", profileId, profileData);
  return await profilesController.update(profileId, profileData);
});

ipcMain.handle("profiles:delete", async (_event, profileId: string) => {
  return await profilesController.delete(profileId);
});

ipcMain.handle("profile:get-using", async (event) => {
  const window = browserWindowsController.getWindowFromWebContents(event.sender);
  if (window) {
    const spaceId = window.currentSpaceId;
    if (spaceId) {
      const space = await spacesController.get(spaceId);
      return space?.profileId;
    }
  }
  return null;
});
