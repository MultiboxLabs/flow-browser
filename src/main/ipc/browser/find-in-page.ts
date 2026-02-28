import { ipcMain } from "electron";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { tabsController } from "@/controllers/tabs-controller";

function getFocusedTabWebContents(senderWebContents: Electron.WebContents) {
  const window = browserWindowsController.getWindowFromWebContents(senderWebContents);
  if (!window) return null;

  const spaceId = window.currentSpaceId;
  if (!spaceId) return null;

  const tab = tabsController.getFocusedTab(window.id, spaceId);
  if (!tab?.webContents || tab.webContents.isDestroyed()) return null;

  return tab.webContents;
}

ipcMain.handle(
  "find-in-page:find",
  (event, text: string, options?: { forward?: boolean; findNext?: boolean }): Promise<{
    requestId: number;
    activeMatchOrdinal: number;
    matches: number;
  } | null> => {
    const wc = getFocusedTabWebContents(event.sender);
    if (!wc || !text) return Promise.resolve(null);

    try {
      const requestId = wc.findInPage(text, {
        forward: options?.forward ?? true,
        findNext: options?.findNext ?? false
      });

      return new Promise((resolve) => {
        const handler = (_e: Electron.Event, result: Electron.Result) => {
          if (result.requestId === requestId) {
            wc.removeListener("found-in-page", handler);
            resolve({
              requestId: result.requestId,
              activeMatchOrdinal: result.activeMatchOrdinal,
              matches: result.matches
            });
          }
        };
        wc.on("found-in-page", handler);

        setTimeout(() => {
          wc.removeListener("found-in-page", handler);
          resolve(null);
        }, 3000);
      });
    } catch {
      return Promise.resolve(null);
    }
  }
);

ipcMain.on("find-in-page:stop", (event, action: "clearSelection" | "keepSelection" | "activateSelection") => {
  const wc = getFocusedTabWebContents(event.sender);
  if (!wc) return;

  try {
    wc.stopFindInPage(action);
  } catch {
    // Tab may have been destroyed
  }
});
