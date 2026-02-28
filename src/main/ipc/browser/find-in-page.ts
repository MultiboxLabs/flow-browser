import { ipcMain, WebContents } from "electron";
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

interface ActiveFindSession {
  tabWc: WebContents;
  handler: (event: Electron.Event, result: Electron.Result) => void;
}

const activeSessions = new Map<number, ActiveFindSession>();

function cleanupSession(senderWcId: number) {
  const session = activeSessions.get(senderWcId);
  if (session) {
    session.tabWc.removeListener("found-in-page", session.handler);
    activeSessions.delete(senderWcId);
  }
}

ipcMain.on(
  "find-in-page:find",
  (event, text: string, options?: { forward?: boolean; findNext?: boolean }) => {
    const wc = getFocusedTabWebContents(event.sender);
    if (!wc || !text) return;

    const senderId = event.sender.id;

    // Clean up any existing listener before setting up a new one
    cleanupSession(senderId);

    const handler = (_e: Electron.Event, result: Electron.Result) => {
      if (event.sender.isDestroyed()) {
        cleanupSession(senderId);
        return;
      }
      event.sender.send("find-in-page:result", {
        activeMatchOrdinal: result.activeMatchOrdinal,
        matches: result.matches
      });
    };

    activeSessions.set(senderId, { tabWc: wc, handler });
    wc.on("found-in-page", handler);

    try {
      wc.findInPage(text, {
        forward: options?.forward ?? true,
        findNext: options?.findNext ?? false
      });
    } catch {
      cleanupSession(senderId);
    }
  }
);

ipcMain.on("find-in-page:stop", (event, action: "clearSelection" | "keepSelection" | "activateSelection") => {
  const wc = getFocusedTabWebContents(event.sender);
  if (wc) {
    try {
      wc.stopFindInPage(action);
    } catch {
      // Tab may have been destroyed
    }
  }
  cleanupSession(event.sender.id);
});
