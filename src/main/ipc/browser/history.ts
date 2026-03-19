import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { spacesController } from "@/controllers/spaces-controller";
import {
  clearBrowsingHistoryForProfile,
  deleteBrowsingUrlRowForProfile,
  deleteBrowsingVisitForProfile,
  listBrowsingHistoryForProfile,
  listBrowsingVisitsForProfile
} from "@/saving/history/browsing-history";
import { ipcMain } from "electron";

async function profileIdFromSender(sender: Electron.WebContents): Promise<string | null> {
  const window = browserWindowsController.getWindowFromWebContents(sender);
  if (!window) return null;
  const spaceId = window.currentSpaceId;
  if (!spaceId) return null;
  const space = await spacesController.get(spaceId);
  return space?.profileId ?? null;
}

ipcMain.handle("history:list", async (event) => {
  const profileId = await profileIdFromSender(event.sender);
  if (!profileId) return [];
  return listBrowsingHistoryForProfile(profileId);
});

ipcMain.handle("history:list-visits", async (event, search?: string) => {
  const profileId = await profileIdFromSender(event.sender);
  if (!profileId) return [];
  return listBrowsingVisitsForProfile(profileId, search);
});

ipcMain.handle("history:delete-visit", async (event, visitId: number) => {
  const profileId = await profileIdFromSender(event.sender);
  if (!profileId) return false;
  return deleteBrowsingVisitForProfile(profileId, visitId);
});

ipcMain.handle("history:delete-url", async (event, urlRowId: number) => {
  const profileId = await profileIdFromSender(event.sender);
  if (!profileId) return false;
  return deleteBrowsingUrlRowForProfile(profileId, urlRowId);
});

ipcMain.handle("history:clear-all", async (event) => {
  const profileId = await profileIdFromSender(event.sender);
  if (!profileId) return;
  clearBrowsingHistoryForProfile(profileId);
});
