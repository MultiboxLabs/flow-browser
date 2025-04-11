import { ipcMain, webContents } from "electron";
import {
  getSpaces,
  getSpacesFromProfile,
  createSpace,
  deleteSpace,
  updateSpace,
  SpaceData,
  setSpaceLastUsed,
  getLastUsedSpace,
  reorderSpaces,
  spacesEmitter
} from "@/sessions/spaces";
import { generateID } from "@/browser/utility/utils";
import { browser } from "@/index";
import { TabbedBrowserWindow } from "@/browser/window";

ipcMain.handle("spaces:get-all", async (event) => {
  return await getSpaces();
});

ipcMain.handle("spaces:get-from-profile", async (event, profileId: string) => {
  return await getSpacesFromProfile(profileId);
});

ipcMain.handle("spaces:create", async (event, profileId: string, spaceName: string) => {
  return await createSpace(profileId, generateID(), spaceName);
});

ipcMain.handle("spaces:delete", async (event, profileId: string, spaceId: string) => {
  return await deleteSpace(profileId, spaceId);
});

ipcMain.handle("spaces:update", async (event, profileId: string, spaceId: string, spaceData: Partial<SpaceData>) => {
  return await updateSpace(profileId, spaceId, spaceData);
});

ipcMain.handle("spaces:set-using", async (event, profileId: string, spaceId: string) => {
  const window = browser?.getWindowFromWebContents(event.sender);
  if (window) {
    window.setCurrentSpace(spaceId);
  }

  return await setSpaceLastUsed(profileId, spaceId);
});

ipcMain.handle("spaces:get-last-used", async (event) => {
  return await getLastUsedSpace();
});

ipcMain.handle("spaces:reorder", async (event, orderMap: { profileId: string; spaceId: string; order: number }[]) => {
  return await reorderSpaces(orderMap);
});

export function setWindowSpace(window: TabbedBrowserWindow, spaceId: string) {
  window.sendMessageToCoreWebContents("spaces:on-set-window-space", spaceId);
}

function fireOnSpacesChanged() {
  browser?.sendMessageToCoreWebContents("spaces:on-changed");
}
spacesEmitter.on("changed", fireOnSpacesChanged);
