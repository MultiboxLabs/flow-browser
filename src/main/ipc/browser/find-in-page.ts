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

// Maps tab webContents id → the chrome webContents to forward results to.
// Updated on every find call so the persistent listener always knows where
// to send results.
const resultTarget = new Map<number, WebContents>();

// Tracks which tab webContents already have a persistent found-in-page
// listener attached. WeakSet so destroyed webContents are GC'd.
const listenedTabs = new WeakSet<WebContents>();

function ensureFoundInPageListener(tabWc: WebContents) {
  if (listenedTabs.has(tabWc)) return;
  listenedTabs.add(tabWc);

  const tabWcId = tabWc.id;

  tabWc.on("found-in-page", (_event, result) => {
    const target = resultTarget.get(tabWcId);
    if (!target || target.isDestroyed()) return;

    target.send("find-in-page:result", {
      activeMatchOrdinal: result.activeMatchOrdinal,
      matches: result.matches
    });
  });

  tabWc.once("destroyed", () => {
    resultTarget.delete(tabWcId);
  });
}

ipcMain.on(
  "find-in-page:find",
  (event, text: string, options?: { forward?: boolean; findNext?: boolean }) => {
    const tabWc = getFocusedTabWebContents(event.sender);
    if (!tabWc || !text) return;

    resultTarget.set(tabWc.id, event.sender);
    ensureFoundInPageListener(tabWc);

    try {
      tabWc.findInPage(text, {
        forward: options?.forward ?? true,
        findNext: options?.findNext ?? false
      });
    } catch {
      // Tab may have been destroyed between the check and the call
    }
  }
);

ipcMain.on("find-in-page:stop", (event, action: "clearSelection" | "keepSelection" | "activateSelection") => {
  const tabWc = getFocusedTabWebContents(event.sender);
  if (!tabWc) return;

  resultTarget.delete(tabWc.id);

  try {
    tabWc.stopFindInPage(action);
  } catch {
    // Tab may have been destroyed
  }
});
