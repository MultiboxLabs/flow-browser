import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { spacesController } from "@/controllers/spaces-controller";
import { listBrowsingHistoryForProfile } from "@/saving/history/browsing-history";
import { ipcMain } from "electron";

ipcMain.handle("history:list", async (event) => {
  const window = browserWindowsController.getWindowFromWebContents(event.sender);
  if (!window) return [];

  const spaceId = window.currentSpaceId;
  if (!spaceId) return [];

  const space = await spacesController.get(spaceId);
  const profileId = space?.profileId;
  if (!profileId) return [];

  return listBrowsingHistoryForProfile(profileId);
});
