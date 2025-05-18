import { ipcMain } from "electron";
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
import { generateID } from "@/modules/utils";
import { browser } from "@/index";
import { TabbedBrowserWindow } from "@/browser/window";
import { sendMessageToListeners, sendMessageToListenersInWindow } from "@/ipc/listeners-manager";

ipcMain.handle("spaces:get-all", async () => {
  return await getSpaces();
});

ipcMain.handle("spaces:get-from-profile", async (_event, profileId: string) => {
  return await getSpacesFromProfile(profileId);
});

ipcMain.handle("spaces:create", async (_event, profileId: string, spaceName: string) => {
  return await createSpace(profileId, generateID(), spaceName);
});

ipcMain.handle("spaces:delete", async (_event, profileId: string, spaceId: string) => {
  return await deleteSpace(profileId, spaceId);
});

ipcMain.handle("spaces:update", async (_event, profileId: string, spaceId: string, spaceData: Partial<SpaceData>) => {
  return await updateSpace(profileId, spaceId, spaceData);
});

ipcMain.handle("spaces:set-using", async (event, profileId: string, spaceId: string) => {
  const window = browser?.getWindowFromWebContents(event.sender);
  if (window) {
    window.setCurrentSpace(spaceId);
  }

  return await setSpaceLastUsed(profileId, spaceId);
});

ipcMain.handle("spaces:get-using", async (event) => {
  const window = browser?.getWindowFromWebContents(event.sender);
  if (window) {
    return window.getCurrentSpace();
  }
  return null;
});

ipcMain.handle("spaces:get-last-used", async () => {
  return await getLastUsedSpace();
});

ipcMain.handle("spaces:reorder", async (_event, orderMap: { profileId: string; spaceId: string; order: number }[]) => {
  return await reorderSpaces(orderMap);
});

export function setWindowSpace(window: TabbedBrowserWindow, spaceId: string) {
  window.setCurrentSpace(spaceId);
  sendMessageToListenersInWindow(window, "spaces:on-set-window-space", spaceId);
}

function fireOnSpacesChanged() {
  sendMessageToListeners("spaces:on-changed");
}
spacesEmitter.on("changed", fireOnSpacesChanged);
