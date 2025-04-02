import { app, BrowserWindow, ipcMain } from "electron";
import "@/modules/icons";
import "@/sessions/profiles";
import { createProfile, deleteProfile, getProfiles, ProfileData, updateProfile } from "@/sessions/profiles";
import { generateID } from "@/browser/utils";

// Window Button IPCs //
ipcMain.on("set-window-button-position", (event, position: { x: number; y: number }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && "setWindowButtonPosition" in win) {
    win.setWindowButtonPosition(position);
  }
});

ipcMain.on("set-window-button-visibility", (event, visible: boolean) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && "setWindowButtonVisibility" in win) {
    win.setWindowButtonVisibility(visible);
  }
});

// Settings IPCs //
ipcMain.handle("get-app-info", async () => {
  return {
    version: app.getVersion(),
    packaged: app.isPackaged
  };
});

// Profiles IPCs //
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
