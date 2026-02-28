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

interface FindSession {
  senderWc: WebContents;
  activeRequestId: number;
}

// Maps tab webContents id → the active find session. Tracks both the
// sender to forward results to AND the latest requestId so stale
// found-in-page events from cancelled searches are filtered out.
const sessions = new Map<number, FindSession>();

// Tracks which tab webContents already have a persistent found-in-page
// listener attached. WeakSet so destroyed webContents are GC'd.
const listenedTabs = new WeakSet<WebContents>();

function ensureFoundInPageListener(tabWc: WebContents) {
  if (listenedTabs.has(tabWc)) return;
  listenedTabs.add(tabWc);

  const tabWcId = tabWc.id;

  tabWc.on("found-in-page", (_event, result) => {
    const session = sessions.get(tabWcId);
    if (!session || session.senderWc.isDestroyed()) return;

    // Only forward events from the most recent findInPage call.
    // Stale events from cancelled searches carry old requestIds.
    if (result.requestId !== session.activeRequestId) return;

    session.senderWc.send("find-in-page:result", {
      activeMatchOrdinal: result.activeMatchOrdinal,
      matches: result.matches
    });
  });

  tabWc.once("destroyed", () => {
    sessions.delete(tabWcId);
  });
}

ipcMain.on(
  "find-in-page:find",
  (event, text: string, options?: { forward?: boolean; findNext?: boolean }) => {
    const tabWc = getFocusedTabWebContents(event.sender);
    if (!tabWc || !text) return;

    ensureFoundInPageListener(tabWc);

    try {
      const isNewSession = options?.findNext ?? false;

      // Stop any active search before starting a new session. Without
      // this, Electron may not properly restart with the new text.
      if (isNewSession) {
        tabWc.stopFindInPage("keepSelection");
      }

      const requestId = tabWc.findInPage(text, {
        forward: options?.forward ?? true,
        findNext: isNewSession
      });

      sessions.set(tabWc.id, {
        senderWc: event.sender,
        activeRequestId: requestId
      });
    } catch {
      // Tab may have been destroyed between the check and the call
    }
  }
);

ipcMain.on("find-in-page:stop", (event, action: "clearSelection" | "keepSelection" | "activateSelection") => {
  const tabWc = getFocusedTabWebContents(event.sender);
  if (!tabWc) return;

  sessions.delete(tabWc.id);

  try {
    tabWc.stopFindInPage(action);
  } catch {
    // Tab may have been destroyed
  }
});
