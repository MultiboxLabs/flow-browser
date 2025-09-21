import { ipcMain } from "electron";
import { browser } from "@/browser";
import { TabbedBrowserWindow } from "@/browser/window";
import { sendMessageToListeners, sendMessageToListenersInWindow } from "@/ipc/listeners-manager";
import { SpaceData, SpaceOrderMap, spacesController } from "@/controllers/spaces-controller";

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

ipcMain.handle("spaces:set-using", async (event, profileId: string, spaceId: string) => {
  const window = browser?.getWindowFromWebContents(event.sender);
  if (window) {
    window.setCurrentSpace(spaceId);
  }

  return await spacesController.setLastUsed(profileId, spaceId);
});

ipcMain.handle("spaces:get-using", async (event) => {
  const window = browser?.getWindowFromWebContents(event.sender);
  if (window) {
    return window.getCurrentSpace();
  }
  return null;
});

ipcMain.handle("spaces:get-last-used", async () => {
  return await spacesController.getLastUsed();
});

ipcMain.handle("spaces:reorder", async (_event, orderMap: SpaceOrderMap) => {
  return await spacesController.reorder(orderMap);
});

export function setWindowSpace(window: TabbedBrowserWindow, spaceId: string) {
  window.setCurrentSpace(spaceId);
  sendMessageToListenersInWindow(window, "spaces:on-set-window-space", spaceId);
}

function fireOnSpacesChanged() {
  sendMessageToListeners("spaces:on-changed");
}
spacesController.on("space-created", fireOnSpacesChanged);
spacesController.on("space-updated", fireOnSpacesChanged);
spacesController.on("space-deleted", fireOnSpacesChanged);
