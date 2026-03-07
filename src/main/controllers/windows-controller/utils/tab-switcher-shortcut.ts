import { appendFileSync } from "node:fs";
import { app, type WebContents, webContents } from "electron";
import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types/browser";

const OVERLAY_DELAY_MS = 180;

type TabSwitcherSession = {
  tabIds: number[];
  selectedTabId: number | null;
  visible: boolean;
  showTimer: ReturnType<typeof setTimeout> | null;
};

const sessions = new Map<number, TabSwitcherSession>();
const registeredWebContentsIds = new Set<number>();

function writeDebugLog(payload: {
  hypothesisId: string;
  location: string;
  message: string;
  data: Record<string, unknown>;
}) {
  appendFileSync("/opt/cursor/logs/debug.log", JSON.stringify({ ...payload, timestamp: Date.now() }) + "\n");
}

function clearShowTimer(session: TabSwitcherSession): void {
  if (!session.showTimer) return;
  clearTimeout(session.showTimer);
  session.showTimer = null;
}

function emitTabSwitcherState(window: BrowserWindow, session: TabSwitcherSession): void {
  const targetContents = window.getAllWebContents().filter((contents) => {
    const url = contents.getURL();
    return url.startsWith("flow-internal://main-ui/") || url.startsWith("flow-internal://popup-ui/");
  });

  // #region agent log
  writeDebugLog({
    hypothesisId: "B",
    location: "src/main/controllers/windows-controller/utils/tab-switcher-shortcut.ts:emitTabSwitcherState",
    message: "Sending tab switcher state to browser UI webcontents",
    data: {
      windowId: window.id,
      targetWebContents: targetContents.map((contents) => ({
        id: contents.id,
        url: contents.getURL()
      })),
      allWebContents: window.getAllWebContents().map((contents) => ({
        id: contents.id,
        url: contents.getURL()
      }))
    }
  });
  // #endregion

  for (const contents of targetContents) {
    contents.send("tabs:on-switcher-state-changed", {
      visible: session.visible,
      tabIds: session.tabIds,
      selectedTabId: session.selectedTabId
    });
  }
}

function hideTabSwitcher(windowId: number): void {
  const session = sessions.get(windowId);
  if (session) {
    // #region agent log
    writeDebugLog({
      hypothesisId: "A",
      location: "src/main/controllers/windows-controller/utils/tab-switcher-shortcut.ts:hideTabSwitcher",
      message: "Hiding tab switcher",
      data: {
        windowId,
        visible: session.visible,
        selectedTabId: session.selectedTabId,
        tabIds: session.tabIds
      }
    });
    // #endregion
    clearShowTimer(session);
    sessions.delete(windowId);
  }

  const window = browserWindowsController.getWindowById(windowId);
  if (!window) return;

  const targetContents = window.getAllWebContents().filter((contents) => {
    const url = contents.getURL();
    return url.startsWith("flow-internal://main-ui/") || url.startsWith("flow-internal://popup-ui/");
  });

  for (const contents of targetContents) {
    contents.send("tabs:on-switcher-state-changed", {
      visible: false,
      tabIds: [],
      selectedTabId: null
    });
  }
}

function getOrderedTabs(window: BrowserWindow) {
  const spaceId = window.currentSpaceId;
  if (!spaceId) return [];

  return tabsController
    .getTabsInWindowSpace(window.id, spaceId)
    .filter((tab) => !tab.isDestroyed)
    .sort((a, b) => a.position - b.position);
}

function advanceTabSwitcher(webContents: WebContents, reverse: boolean): boolean {
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  const spaceId = window.currentSpaceId;
  if (!spaceId) return false;

  const orderedTabs = getOrderedTabs(window);
  if (orderedTabs.length < 2) return false;

  const session = sessions.get(window.id);
  const baseTabId =
    session?.selectedTabId ?? tabsController.getFocusedTab(window.id, spaceId)?.id ?? orderedTabs[0]?.id ?? null;
  if (baseTabId === null) return false;

  const baseIndex = orderedTabs.findIndex((tab) => tab.id === baseTabId);
  const normalizedBaseIndex = baseIndex >= 0 ? baseIndex : 0;
  const direction = reverse ? -1 : 1;
  const nextIndex = (normalizedBaseIndex + direction + orderedTabs.length) % orderedTabs.length;
  const nextTab = orderedTabs[nextIndex];
  if (!nextTab) return false;

  const nextSession: TabSwitcherSession = session ?? {
    tabIds: [],
    selectedTabId: null,
    visible: false,
    showTimer: null
  };

  nextSession.tabIds = orderedTabs.map((tab) => tab.id);
  nextSession.selectedTabId = nextTab.id;

  // #region agent log
  writeDebugLog({
    hypothesisId: "A",
    location: "src/main/controllers/windows-controller/utils/tab-switcher-shortcut.ts:advanceTabSwitcher",
    message: "Advancing tab switcher",
    data: {
      windowId: window.id,
      reverse,
      hadSession: !!session,
      sessionVisible: nextSession.visible,
      baseTabId,
      nextTabId: nextTab.id,
      orderedTabIds: nextSession.tabIds
    }
  });
  // #endregion

  if (!session) {
    nextSession.showTimer = setTimeout(() => {
      const currentSession = sessions.get(window.id);
      if (!currentSession) return;

      currentSession.visible = true;
      currentSession.showTimer = null;
      // #region agent log
      writeDebugLog({
        hypothesisId: "A",
        location: "src/main/controllers/windows-controller/utils/tab-switcher-shortcut.ts:showTimer",
        message: "Tab switcher timer made session visible",
        data: {
          windowId: window.id,
          selectedTabId: currentSession.selectedTabId,
          tabIds: currentSession.tabIds
        }
      });
      // #endregion
      emitTabSwitcherState(window, currentSession);
    }, OVERLAY_DELAY_MS);
  }

  sessions.set(window.id, nextSession);
  tabsController.setActiveTab(nextTab);

  if (nextSession.visible) {
    emitTabSwitcherState(window, nextSession);
  }

  return true;
}

function registerWebContents(webContents: WebContents): void {
  if (registeredWebContentsIds.has(webContents.id)) return;
  registeredWebContentsIds.add(webContents.id);

  webContents.on("before-input-event", (event, input) => {
    const isCtrlTab =
      input.type === "keyDown" &&
      input.key === "Tab" &&
      input.control &&
      !input.alt &&
      !input.meta &&
      !input.isAutoRepeat;

    if (isCtrlTab) {
      if (advanceTabSwitcher(webContents, !!input.shift)) {
        event.preventDefault();
      }
      return;
    }

    const isControlReleased = input.type === "keyUp" && input.key === "Control";
    if (!isControlReleased) return;

    const window = browserWindowsController.getWindowFromWebContents(webContents);
    if (!window) return;

    hideTabSwitcher(window.id);
  });

  webContents.on("destroyed", () => {
    registeredWebContentsIds.delete(webContents.id);
  });
}

function scanExistingWebContents(): void {
  webContents.getAllWebContents().forEach((contents) => {
    registerWebContents(contents);
  });
}

scanExistingWebContents();

app.on("web-contents-created", (_event, webContents) => {
  registerWebContents(webContents);
});

app.on("browser-window-blur", (_event, browserWindow) => {
  const window = browserWindowsController
    .getWindows()
    .find((candidate) => candidate.browserWindow.id === browserWindow.id);
  if (!window) return;

  hideTabSwitcher(window.id);
});
