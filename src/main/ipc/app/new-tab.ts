import { getSettingValueById } from "@/saving/settings";
import { spacesController } from "@/controllers/spaces-controller";
import { ipcMain } from "electron";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { tabsController } from "@/controllers/tabs-controller";

export function openNewTab(window: BrowserWindow) {
  const omnibox = window.omnibox;

  if (getSettingValueById("newTabMode") === "omnibox") {
    if (omnibox.isVisible()) {
      omnibox.hide();
    } else {
      omnibox.show();
    }
  } else {
    const spaceId = window.currentSpaceId;
    if (!spaceId) return;

    spacesController.get(spaceId).then(async (space) => {
      if (!space) return;

      const tab = await tabsController.createTab(window.id, space.profileId, spaceId);
      tabsController.setActiveTab(tab);
    });
  }
}

ipcMain.on("new-tab:open", (event) => {
  const webContents = event.sender;
  const win = browserWindowsController.getWindowFromWebContents(webContents);
  if (!win) return;

  return openNewTab(win);
});
