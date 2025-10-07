import { browser } from "@/browser";
import { getSettingValueById } from "@/saving/settings";
import { spacesController } from "@/controllers/spaces-controller";
import { ipcMain } from "electron";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types";

export function openNewTab(window: BrowserWindow) {
  const omnibox = window.omnibox;

  if (getSettingValueById("newTabMode") === "omnibox") {
    if (omnibox.isVisible()) {
      omnibox.hide();
    } else {
      omnibox.loadInterface(null);
      omnibox.setBounds(null);
      omnibox.show();
    }
  } else {
    const spaceId = window.currentSpaceId;
    if (!spaceId) return;

    const tabManager = browser?.tabs;
    if (!tabManager) return;

    spacesController.get(spaceId).then(async (space) => {
      if (!space) return;

      const tab = await tabManager.createTab(window.id, space.profileId, spaceId);
      tabManager.setActiveTab(tab);
    });
  }
}

ipcMain.on("new-tab:open", (event) => {
  const webContents = event.sender;
  const win = browserWindowsController.getWindowFromWebContents(webContents);
  if (!win) return;

  return openNewTab(win);
});
