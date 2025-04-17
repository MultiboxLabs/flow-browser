import { hideOmnibox, isOmniboxOpen, loadOmnibox, setOmniboxBounds, showOmnibox } from "@/browser/components/omnibox";
import { TabbedBrowserWindow } from "@/browser/window";
import { browser } from "@/index";
import { NewTabMode, getCurrentNewTabMode, setCurrentNewTabMode } from "@/saving/settings";
import { getSpace } from "@/sessions/spaces";
import { ipcMain } from "electron";

ipcMain.handle("new-tab-mode:get", () => {
  return getCurrentNewTabMode();
});

ipcMain.handle("new-tab-mode:set", (_, newTabMode: NewTabMode) => {
  return setCurrentNewTabMode(newTabMode);
});

export function openNewTab(tabbedBrowserWindow: TabbedBrowserWindow) {
  const browserWindow = tabbedBrowserWindow.window;

  if (getCurrentNewTabMode() === "omnibox") {
    if (isOmniboxOpen(browserWindow)) {
      hideOmnibox(browserWindow);
    } else {
      loadOmnibox(browserWindow, null);
      setOmniboxBounds(browserWindow, null);
      showOmnibox(browserWindow);
    }
  } else {
    if (tabbedBrowserWindow) {
      const spaceId = tabbedBrowserWindow.getCurrentSpace();
      if (!spaceId) return;

      const tabManager = browser?.tabs;
      if (!tabManager) return;

      getSpace(spaceId).then(async (space) => {
        if (!space) return;

        const tab = await tabManager.createTab(tabbedBrowserWindow.id, space.profileId, spaceId);
        tabManager.setActiveTab(tab);
      });
    }
  }
}

ipcMain.on("new-tab:open", (event) => {
  const webContents = event.sender;
  const win = browser?.getWindowFromWebContents(webContents);
  if (!win) return;

  return openNewTab(win);
});
