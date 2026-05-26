import { getSettingValueById } from "@/saving/settings";
import { spacesController } from "@/controllers/spaces-controller";
import { ipcMain } from "electron";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { tabService } from "@/services/tab-service";

export function openNewTab(window: BrowserWindow) {
  const omnibox = window.omnibox;

  if (getSettingValueById("newTabMode") === "omnibox") {
    if (omnibox.isVisible()) {
      omnibox.hide();
    } else {
      omnibox.setOpenState({
        currentInput: "",
        openIn: "new_tab"
      });
      omnibox.setBounds(null);
      omnibox.show();
    }
  } else {
    const spaceId = window.currentSpaceId;
    if (!spaceId) return;

    spacesController.get(spaceId).then(async (space) => {
      if (!space) return;

      const tab = tabService.createTabInternal(window.id, space.profileId, spaceId);
      tabService.activateTab(tab);
    });
  }
}

ipcMain.on("new-tab:open", (event) => {
  const webContents = event.sender;
  const win = browserWindowsController.getWindowFromWebContents(webContents);
  if (!win) return;

  return openNewTab(win);
});
