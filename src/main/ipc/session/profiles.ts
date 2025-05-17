import { getProfiles, ProfileData, createProfile, updateProfile, deleteProfile } from "@/sessions/profiles";
import { generateID } from "@/modules/utils";
import { ipcMain } from "electron";
import { browser } from "@/index";
import { getSpace } from "@/sessions/spaces";

ipcMain.handle("profiles:get-all", async () => {
  return await getProfiles();
});

ipcMain.handle("profiles:create", async (_event, profileName: string) => {
  const profileId = generateID();
  return await createProfile(profileId, profileName);
});

ipcMain.handle("profiles:update", async (_event, profileId: string, profileData: Partial<ProfileData>) => {
  console.log("Updating profile:", profileId, profileData);
  return await updateProfile(profileId, profileData);
});

ipcMain.handle("profiles:delete", async (_event, profileId: string) => {
  return await deleteProfile(profileId);
});

ipcMain.handle("profile:get-using", async (event) => {
  const window = browser?.getWindowFromWebContents(event.sender);
  if (window) {
    const spaceId = window.getCurrentSpace();
    if (spaceId) {
      const space = await getSpace(spaceId);
      return space?.profileId;
    }
  }
  return null;
});
