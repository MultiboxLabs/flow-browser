import { MenuItemConstructorOptions } from "electron";
import { Browser } from "@/browser/browser";
import { hideOmnibox, isOmniboxOpen, loadOmnibox, setOmniboxBounds, showOmnibox } from "@/browser/components/omnibox";
import { getCurrentNewTabMode } from "@/saving/settings";
import { getSpace } from "@/sessions/spaces";
import { getFocusedBrowserWindowData } from "../helpers";

export const createFileMenu = (browser: Browser): MenuItemConstructorOptions => ({
  label: "File",
  submenu: [
    {
      label: "New Tab",
      accelerator: "CmdOrCtrl+T",
      click: () => {
        const winData = getFocusedBrowserWindowData();
        if (!winData) return;

        const browserWindow = winData.window;
        const win = winData.tabbedBrowserWindow;

        if (getCurrentNewTabMode() === "omnibox") {
          if (isOmniboxOpen(browserWindow)) {
            hideOmnibox(browserWindow);
          } else {
            loadOmnibox(browserWindow, null);
            setOmniboxBounds(browserWindow, null);
            showOmnibox(browserWindow);
          }
        } else {
          if (win) {
            const spaceId = win.getCurrentSpace();
            if (!spaceId) return;

            getSpace(spaceId).then((space) => {
              if (!space) return;
              browser.tabs.createTab(space.profileId, win.id, spaceId);
            });
          }
        }
      }
    },
    {
      label: "New Window",
      accelerator: "CmdOrCtrl+N",
      click: () => {
        browser.createWindow();
      }
    }
  ]
});
