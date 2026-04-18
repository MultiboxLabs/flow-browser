import { ipcMain } from "electron";
import { sendMessageToListeners } from "@/ipc/listeners-manager";
import { SpaceData, SpaceOrderMap, spacesController } from "@/controllers/spaces-controller";
import { profilesController } from "@/controllers/profiles-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types";

ipcMain.handle("spaces:get-all", async () => {
  return await spacesController.getAll();
});

ipcMain.handle("spaces:get-from-profile", async (_event, profileId: string) => {
  return await spacesController.getAllFromProfile(profileId);
});

ipcMain.handle("spaces:create", async (_event, profileId: string, spaceName: string) => {
  return await spacesController.create(profileId, spaceName);
});

ipcMain.handle("spaces:delete", async (_event, profileId: string, spaceId: string) => {
  return await spacesController.delete(profileId, spaceId);
});

ipcMain.handle("spaces:update", async (_event, profileId: string, spaceId: string, spaceData: Partial<SpaceData>) => {
  return await spacesController.update(profileId, spaceId, spaceData);
});

export async function setUsingSpace(window: BrowserWindow | null, profileId: string, spaceId: string) {
  if (window) {
    const canSwitch = await canUserSwitchWindowSpace(window, profileId, spaceId);
    if (!canSwitch) {
      return false;
    }
    setWindowSpace(window, spaceId);
  }

  return await spacesController.setLastUsed(profileId, spaceId);
}
ipcMain.handle("spaces:set-using", async (event, profileId: string, spaceId: string) => {
  const window = browserWindowsController.getWindowFromWebContents(event.sender);
  return await setUsingSpace(window, profileId, spaceId);
});

ipcMain.handle("spaces:get-using", async (event) => {
  const window = browserWindowsController.getWindowFromWebContents(event.sender);
  if (window) {
    return window.currentSpaceId;
  }
  return null;
});

ipcMain.handle("spaces:get-last-used", async () => {
  return await spacesController.getLastUsed();
});

ipcMain.handle("spaces:reorder", async (_event, orderMap: SpaceOrderMap) => {
  return await spacesController.reorder(orderMap);
});

export function setWindowSpace(window: BrowserWindow, spaceId: string) {
  window.setCurrentSpace(spaceId);
  window.sendMessage("spaces:on-set-window-space", spaceId);
}

export async function canUserSwitchWindowSpace(
  window: BrowserWindow,
  profileId: string,
  spaceId: string
): Promise<boolean> {
  if (window.browserWindowType === "popup") {
    return false;
  }

  const targetProfile = await profilesController.get(profileId);
  if (targetProfile?.internal) {
    return false;
  }

  const currentSpaceId = window.currentSpaceId;
  if (!currentSpaceId || currentSpaceId === spaceId) {
    return true;
  }

  const currentSpace = await spacesController.get(currentSpaceId);
  if (!currentSpace) {
    return true;
  }

  const currentProfile = await profilesController.get(currentSpace.profileId);
  return !currentProfile?.internal;
}

function fireOnSpacesChanged() {
  sendMessageToListeners("spaces:on-changed");
}
spacesController.on("space-created", fireOnSpacesChanged);
spacesController.on("space-updated", fireOnSpacesChanged);
spacesController.on("space-deleted", fireOnSpacesChanged);
