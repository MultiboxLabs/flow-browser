import { app, type WebContents, webContents } from "electron";
import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types/browser";
import type { TabSwitcherState, TabSwitcherTab } from "~/flow/interfaces/browser/tabs";

const OVERLAY_DELAY_MS = 180;

type TabSwitcherSession = {
  tabs: TabSwitcherTab[];
  selectedTabId: number | null;
  visible: boolean;
  showTimer: ReturnType<typeof setTimeout> | null;
};

const sessions = new Map<number, TabSwitcherSession>();
const registeredWebContentsIds = new Set<number>();

function clearShowTimer(session: TabSwitcherSession): void {
  if (!session.showTimer) return;
  clearTimeout(session.showTimer);
  session.showTimer = null;
}

function resolveWindowFromWebContents(source: WebContents): BrowserWindow | null {
  const mappedWindow = browserWindowsController.getWindowFromWebContents(source);
  if (mappedWindow instanceof BrowserWindow) {
    return mappedWindow;
  }

  const focusedWindow = browserWindowsController.getFocusedWindow();
  return focusedWindow instanceof BrowserWindow ? focusedWindow : null;
}

function getOrderedTabs(window: BrowserWindow) {
  const spaceId = window.currentSpaceId;
  if (!spaceId) return [];

  return tabsController
    .getTabsInWindowSpace(window.id, spaceId)
    .filter((tab) => !tab.isDestroyed)
    .sort((a, b) => a.position - b.position);
}

function serializeSwitcherTabs(window: BrowserWindow): TabSwitcherTab[] {
  return getOrderedTabs(window).map((tab) => ({
    id: tab.id,
    title: tab.title,
    url: tab.url,
    faviconURL: tab.faviconURL,
    asleep: tab.asleep
  }));
}

function buildHiddenState(): TabSwitcherState {
  return {
    visible: false,
    tabs: [],
    selectedTabId: null
  };
}

function buildVisibleState(session: TabSwitcherSession): TabSwitcherState {
  return {
    visible: session.visible,
    tabs: session.tabs,
    selectedTabId: session.selectedTabId
  };
}

function emitTabSwitcherState(window: BrowserWindow, state: TabSwitcherState): void {
  const targets = [window.browserWindow.webContents, window.omnibox.webContents].filter(
    (target) => !target.isDestroyed()
  );

  for (const target of targets) {
    target.send("tabs:on-switcher-state-changed", state);
  }
}

function focusSelectedTab(window: BrowserWindow, session: TabSwitcherSession | undefined): void {
  const selectedTabId = session?.selectedTabId;
  if (!selectedTabId) return;

  const selectedTab = tabsController.getTabById(selectedTabId);
  if (!selectedTab || selectedTab.getWindow().id !== window.id) return;

  selectedTab.webContents?.focus();
}

function scheduleOverlayReveal(window: BrowserWindow, session: TabSwitcherSession): void {
  session.showTimer = setTimeout(() => {
    const currentSession = sessions.get(window.id);
    if (!currentSession) return;

    currentSession.visible = true;
    currentSession.showTimer = null;
    emitTabSwitcherState(window, buildVisibleState(currentSession));
  }, OVERLAY_DELAY_MS);
}

export function advanceTabSwitcherForWindow(window: BrowserWindow, reverse: boolean): boolean {
  const orderedTabs = getOrderedTabs(window);
  if (orderedTabs.length < 2) return false;

  const spaceId = window.currentSpaceId;
  if (!spaceId) return false;

  const existingSession = sessions.get(window.id);
  const baseTabId =
    existingSession?.selectedTabId ?? tabsController.getFocusedTab(window.id, spaceId)?.id ?? orderedTabs[0]?.id ?? null;
  if (baseTabId === null) return false;

  const currentIndex = orderedTabs.findIndex((tab) => tab.id === baseTabId);
  const normalizedIndex = currentIndex >= 0 ? currentIndex : 0;
  const direction = reverse ? -1 : 1;
  const nextIndex = (normalizedIndex + direction + orderedTabs.length) % orderedTabs.length;
  const nextTab = orderedTabs[nextIndex];
  if (!nextTab) return false;

  const session: TabSwitcherSession = existingSession ?? {
    tabs: [],
    selectedTabId: null,
    visible: false,
    showTimer: null
  };

  session.tabs = serializeSwitcherTabs(window);
  session.selectedTabId = nextTab.id;
  sessions.set(window.id, session);

  tabsController.setActiveTab(nextTab);

  if (!existingSession) {
    scheduleOverlayReveal(window, session);
  } else if (session.visible) {
    emitTabSwitcherState(window, buildVisibleState(session));
  }

  return true;
}

export function advanceTabSwitcherFromWebContents(source: WebContents, reverse: boolean): boolean {
  const window = resolveWindowFromWebContents(source);
  if (!window) return false;

  return advanceTabSwitcherForWindow(window, reverse);
}

export function hideTabSwitcherForWindow(window: BrowserWindow): boolean {
  const session = sessions.get(window.id);
  if (!session) return false;

  clearShowTimer(session);
  sessions.delete(window.id);
  emitTabSwitcherState(window, buildHiddenState());
  focusSelectedTab(window, session);
  return true;
}

export function hideTabSwitcherFromWebContents(source: WebContents): boolean {
  const window = resolveWindowFromWebContents(source);
  if (!window) return false;

  return hideTabSwitcherForWindow(window);
}

function registerWebContents(source: WebContents): void {
  if (registeredWebContentsIds.has(source.id)) return;
  registeredWebContentsIds.add(source.id);

  source.on("before-input-event", (event, input) => {
    const isCtrlTab =
      input.type === "keyDown" &&
      input.key === "Tab" &&
      input.control &&
      !input.alt &&
      !input.meta &&
      !input.isAutoRepeat;

    if (isCtrlTab) {
      if (advanceTabSwitcherFromWebContents(source, !!input.shift)) {
        event.preventDefault();
      }
      return;
    }

    const isControlReleased = input.type === "keyUp" && input.key === "Control";
    if (!isControlReleased) return;

    hideTabSwitcherFromWebContents(source);
  });

  source.on("destroyed", () => {
    registeredWebContentsIds.delete(source.id);
  });
}

webContents.getAllWebContents().forEach(registerWebContents);

app.on("web-contents-created", (_event, createdWebContents) => {
  registerWebContents(createdWebContents);
});

app.on("browser-window-blur", (_event, browserWindow) => {
  const window = browserWindowsController
    .getWindows()
    .find((candidate) => candidate.browserWindow.id === browserWindow.id);

  if (window instanceof BrowserWindow) {
    hideTabSwitcherForWindow(window);
  }
});
