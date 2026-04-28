// Ctrl+Tab MRU tab switcher: first Tab while Control is held defers activation until
// Control is released (instant tap switches once with no overlay). A second Tab opens
// the overlay and cycles; releasing Control activates the selected tab.
//
// While the MRU overlay is open (PortalComponent), key repeat is handled in the portal
// renderer via DOM listeners (ownerDocument.defaultView) and IPC — see
// tab-cycle-overlay.tsx and portalTabCycleStep / portalTabCycleControlReleased.

import { app, webContents, type WebContents, type Input } from "electron";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { tabsController } from "@/controllers/tabs-controller";
import { Tab } from "@/controllers/tabs-controller/tab";
import {
  removeSnapshot,
  storeSnapshot
} from "@/controllers/sessions-controller/protocols/_protocols/flow-internal/tab-snapshot";
import type { BrowserWindow } from "@/controllers/windows-controller/types";
import type { TabCycleOverlayPayload, TabCycleOverlayTab } from "~/types/tabs";

type WindowSpaceReference = `${number}-${string}`;

interface TabCycleSession {
  windowId: number;
  spaceId: string;
  mruTabIds: number[];
  cycleIndex: number;
  /** Counts Tab presses in this Control hold; 1 = deferred MRU switch, 2+ = show UI */
  tabPressCount: number;
  uiShown: boolean;
  snapshotIds: string[];
  tabsPayload: TabCycleOverlayTab[] | null;
}

const registeredWebContentIds = new Set<number>();
const sessions = new Map<number, TabCycleSession>();

function windowSpaceRef(windowId: number, spaceId: string): WindowSpaceReference {
  return `${windowId}-${spaceId}`;
}

function flattenActivatableTabIds(windowId: number, spaceId: string): number[] {
  const ordered = tabsController.getOrderedActivatableItems(windowId, spaceId);
  const ids: number[] = [];
  for (const item of ordered) {
    if (item instanceof Tab) {
      if (!item.ephemeral) ids.push(item.id);
    } else {
      for (const t of item.tabs) {
        if (!t.ephemeral) ids.push(t.id);
      }
    }
  }
  return ids;
}

function buildMruTabIds(windowId: number, spaceId: string): number[] {
  const ref = windowSpaceRef(windowId, spaceId);
  const history = tabsController.spaceActivationHistory.get(ref) ?? [];
  const seen = new Set<number>();
  const mru: number[] = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (typeof entry === "number") {
      const tab = tabsController.getTabById(entry);
      if (
        tab &&
        !tab.isDestroyed &&
        !tab.ephemeral &&
        tab.spaceId === spaceId &&
        tab.getWindow().id === windowId &&
        !seen.has(entry)
      ) {
        seen.add(entry);
        mru.push(entry);
      }
    } else {
      const group = tabsController.getTabGroupById(entry);
      if (
        group &&
        !group.isDestroyed &&
        group.spaceId === spaceId &&
        group.windowId === windowId &&
        group.tabs.length > 0
      ) {
        const sorted = [...group.tabs].sort((a, b) => a.position - b.position);
        for (const t of sorted) {
          if (!t.ephemeral && !seen.has(t.id)) {
            seen.add(t.id);
            mru.push(t.id);
          }
        }
      }
    }
  }

  for (const id of flattenActivatableTabIds(windowId, spaceId)) {
    if (!seen.has(id)) {
      seen.add(id);
      mru.push(id);
    }
  }

  return mru;
}

function getFocusedTabIdInSpace(window: BrowserWindow, spaceId: string): number | null {
  const focused = tabsController.getFocusedTab(window.id, spaceId);
  return focused?.id ?? null;
}

function sendOverlayUpdate(window: BrowserWindow, payload: TabCycleOverlayPayload | null) {
  window.sendMessageToCoreWebContents("tabs:tab-cycle-overlay", payload);
}

function clearSnapshotIds(session: TabCycleSession) {
  for (const id of session.snapshotIds) {
    removeSnapshot(id);
  }
  session.snapshotIds.length = 0;
  session.tabsPayload = null;
}

export function endTabCycleSession(windowId: number, opts: { activate: boolean }) {
  const session = sessions.get(windowId);
  if (!session) return;

  if (opts.activate && session.mruTabIds.length > 0) {
    const tabId = session.mruTabIds[session.cycleIndex % session.mruTabIds.length];
    const tab = tabsController.getTabById(tabId);
    if (tab && !tab.isDestroyed) {
      tabsController.activateTab(tab);
    }
  }

  clearSnapshotIds(session);
  sessions.delete(windowId);
  const win = browserWindowsController.getWindowById(windowId) as BrowserWindow | null;
  if (win && !win.destroyed) {
    sendOverlayUpdate(win, null);
  }
}

async function captureSnapshotsForTabs(tabIds: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  await Promise.all(
    tabIds.map(async (tabId) => {
      const tab = tabsController.getTabById(tabId);
      const wc = tab?.webContents;
      if (!tab || !wc || tab.isDestroyed || tab.asleep) return;
      try {
        const image = await wc.capturePage();
        if (image.isEmpty()) return;
        const id = storeSnapshot(image);
        map.set(tabId, id);
      } catch {
        // ignore capture failures
      }
    })
  );
  return map;
}

function buildTabsPayload(tabIds: number[], snapshotMap: Map<number, string>): TabCycleOverlayTab[] {
  return tabIds.map((id) => {
    const tab = tabsController.getTabById(id);
    const snapId = snapshotMap.get(id);
    return {
      tabId: id,
      title: tab?.title ?? "Tab",
      faviconURL: tab?.faviconURL ?? null,
      snapshotUrl: snapId ? `flow-internal://tab-snapshot?id=${snapId}` : null
    };
  });
}

async function ensureUiPayload(window: BrowserWindow, session: TabCycleSession): Promise<void> {
  if (!session.tabsPayload) {
    const snapshotMap = await captureSnapshotsForTabs(session.mruTabIds);
    for (const [, snapId] of snapshotMap) {
      session.snapshotIds.push(snapId);
    }
    session.tabsPayload = buildTabsPayload(session.mruTabIds, snapshotMap);
  }

  sendOverlayUpdate(window, {
    windowId: session.windowId,
    spaceId: session.spaceId,
    mruTabIds: session.mruTabIds,
    cycleIndex: session.cycleIndex,
    tabs: session.tabsPayload
  });
}

function startOrContinueSession(window: BrowserWindow, spaceId: string, backward: boolean): void {
  const mru = buildMruTabIds(window.id, spaceId);
  if (mru.length <= 1) {
    if (backward) {
      tabsController.activatePreviousTabInSpace(window.id, spaceId);
    } else {
      tabsController.activateNextTabInSpace(window.id, spaceId);
    }
    return;
  }

  let session = sessions.get(window.id);
  if (!session || session.spaceId !== spaceId) {
    if (session) {
      clearSnapshotIds(session);
    }
    const focusedId = getFocusedTabIdInSpace(window, spaceId);
    const startIndex = focusedId !== null ? Math.max(0, mru.indexOf(focusedId)) : 0;
    session = {
      windowId: window.id,
      spaceId,
      mruTabIds: mru,
      cycleIndex: startIndex,
      tabPressCount: 0,
      uiShown: false,
      snapshotIds: [],
      tabsPayload: null
    };
    sessions.set(window.id, session);
  }

  session.tabPressCount += 1;
  const n = session.mruTabIds.length;
  if (backward) {
    session.cycleIndex = (session.cycleIndex - 1 + n) % n;
  } else {
    session.cycleIndex = (session.cycleIndex + 1) % n;
  }

  if (session.tabPressCount === 1) {
    sendOverlayUpdate(window, null);
    return;
  }

  session.uiShown = true;
  void ensureUiPayload(window, session);
}

/**
 * Advance MRU selection while the overlay is visible (portal DOM sends Tab; we must not
 * bump tabPressCount — that is only for the tab WebContents Ctrl+Tab sequence).
 */
export function portalTabCycleStep(windowId: number, backward: boolean): void {
  const window = browserWindowsController.getWindowById(windowId) as BrowserWindow | null;
  if (!window || window.destroyed) return;

  const session = sessions.get(windowId);
  if (!session?.uiShown) return;

  const spaceId = window.currentSpaceId;
  if (!spaceId || session.spaceId !== spaceId) return;

  const n = session.mruTabIds.length;
  if (n <= 1) return;

  if (backward) {
    session.cycleIndex = (session.cycleIndex - 1 + n) % n;
  } else {
    session.cycleIndex = (session.cycleIndex + 1) % n;
  }

  void ensureUiPayload(window, session);
}

export function portalTabCycleControlReleased(windowId: number): void {
  const session = sessions.get(windowId);
  if (!session?.uiShown) return;
  endTabCycleSession(windowId, { activate: true });
}

function onControlReleasedFromSender(wc: WebContents) {
  const windowFromSender = browserWindowsController.getWindowFromWebContents(wc);
  if (!windowFromSender || windowFromSender.type !== "browser") return;

  const browserWin = windowFromSender as BrowserWindow;
  if (!sessions.has(browserWin.id)) return;

  endTabCycleSession(browserWin.id, { activate: true });
}

function attachTabCycleHandlers(wc: WebContents) {
  const onBeforeInput = (event: { preventDefault: () => void }, input: Input) => {
    if (input.type === "keyDown" && input.key === "Tab" && input.control && !input.meta) {
      if (input.isAutoRepeat) {
        return;
      }

      const baseWindow = browserWindowsController.getWindowFromWebContents(wc);
      if (!baseWindow || baseWindow.type !== "browser") return;

      const window = baseWindow as BrowserWindow;
      const spaceId = window.currentSpaceId;
      if (!spaceId) return;

      const session = sessions.get(window.id);
      if (session?.uiShown) {
        // Overlay is open but focus may still be on the tab WebContents — cycle here too.
        event.preventDefault();
        portalTabCycleStep(window.id, input.shift);
        return;
      }

      event.preventDefault();
      startOrContinueSession(window, spaceId, input.shift);
      return;
    }

    if (input.type === "keyUp" && input.key === "Control" && input.control) {
      const win = browserWindowsController.getWindowFromWebContents(wc);
      if (!win || win.type !== "browser") return;
      if (!sessions.has(win.id)) return;
      event.preventDefault();
      onControlReleasedFromSender(wc);
    }
  };

  wc.on("before-input-event", onBeforeInput);

  wc.once("destroyed", () => {
    wc.removeListener("before-input-event", onBeforeInput);
    registeredWebContentIds.delete(wc.id);
  });
}

/**
 * Register Ctrl+Tab / Control-release handlers on this WebContents (tab page,
 * main chrome, or portal overlay). Idempotent per wc.id.
 */
export function registerTabCycleWebContents(wc: WebContents) {
  if (registeredWebContentIds.has(wc.id)) return;
  registeredWebContentIds.add(wc.id);
  attachTabCycleHandlers(wc);
}

function scan() {
  webContents.getAllWebContents().forEach((wc) => {
    registerTabCycleWebContents(wc);
  });
}

scan();
app.on("web-contents-created", (_event, wc) => {
  registerTabCycleWebContents(wc);
});
