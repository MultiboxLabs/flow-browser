import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { spacesController } from "@/controllers/spaces-controller";
import { tabsController } from "@/controllers/tabs-controller";
import {
  clearBrowsingHistoryForProfile,
  deleteBrowsingUrlRowForProfile,
  deleteBrowsingVisitForProfile,
  getBrowsingUrlValueForProfile,
  getBrowsingVisitUrlForProfile,
  listBrowsingHistoryForProfile,
  listBrowsingVisitsForProfile,
  listBrowsingVisitsPageForProfile
} from "@/saving/history/browsing-history";
import type { HistoryVisitsPageCursor } from "~/types/history";
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

ipcMain.handle(
  "history:list-visits-page",
  async (event, args: { search?: string; limit: number; cursor?: HistoryVisitsPageCursor }) => {
    const profileId = await profileIdFromSender(event.sender);
    if (!profileId) return { visits: [], nextCursor: null };
    return listBrowsingVisitsPageForProfile(profileId, args);
  }
);

ipcMain.handle("history:delete-visit", async (event, visitId: number) => {
  const profileId = await profileIdFromSender(event.sender);
  if (!profileId) return false;
  const url = getBrowsingVisitUrlForProfile(profileId, visitId);
  const deleted = deleteBrowsingVisitForProfile(profileId, visitId);
  if (deleted) {
    tabsController.clearBrowsingHistoryDedupingForProfile(profileId, url ?? undefined);
  }
  return deleted;
});

ipcMain.handle("history:delete-url", async (event, urlRowId: number) => {
  const profileId = await profileIdFromSender(event.sender);
  if (!profileId) return false;
  const url = getBrowsingUrlValueForProfile(profileId, urlRowId);
  const deleted = deleteBrowsingUrlRowForProfile(profileId, urlRowId);
  if (deleted) {
    tabsController.clearBrowsingHistoryDedupingForProfile(profileId, url ?? undefined);
  }
  return deleted;
});

ipcMain.handle("history:clear-all", async (event) => {
  const profileId = await profileIdFromSender(event.sender);
  if (!profileId) return;
  clearBrowsingHistoryForProfile(profileId);
  tabsController.clearBrowsingHistoryDedupingForProfile(profileId);
});
