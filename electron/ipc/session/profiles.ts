import { getProfiles, ProfileData, createProfile, updateProfile, deleteProfile } from "@/sessions/profiles";
import { generateID } from "@/browser/utility/utils";
import { ipcMain } from "electron";

ipcMain.handle("profiles:get-all", async () => {
  return await getProfiles();
});

ipcMain.handle("profiles:create", async (event, profileName: string) => {
  const profileId = generateID();
  return await createProfile(profileId, profileName);
});

ipcMain.handle("profiles:update", async (event, profileId: string, profileData: Partial<ProfileData>) => {
  console.log("Updating profile:", profileId, profileData);
  return await updateProfile(profileId, profileData);
});

ipcMain.handle("profiles:delete", async (event, profileId: string) => {
  return await deleteProfile(profileId);
});
