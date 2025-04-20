import { type BrowserWindow } from "electron";
import { browser } from "@/index";
import { TabbedBrowserWindow } from "@/browser/window";
import { EventEmitter } from "events";

export type WindowData = {
  id: string;
  type: WindowType;
  window: BrowserWindow;
  tabbedBrowserWindow?: TabbedBrowserWindow;
};
const mainWindows: WindowData[] = [];

export enum WindowType {
  BROWSER = "browser",
  EXTENSION_POPUP = "extension-popup",
  SETTINGS = "settings",
  ONBOARDING = "onboarding"
}

export enum WindowEventType {
  ADDED = "window-added",
  REMOVED = "window-removed",
  UPDATED = "window-updated",
  FOCUSED = "window-focused"
}

type WindowEventsType = {
  [WindowEventType.ADDED]: (windowData: WindowData) => void;
  [WindowEventType.REMOVED]: (windowData: WindowData) => void;
  [WindowEventType.UPDATED]: (windowData: WindowData) => void;
  [WindowEventType.FOCUSED]: (window: BrowserWindow) => void;
};

export const windowEvents = new EventEmitter() as {
  on: <K extends keyof WindowEventsType>(event: K, listener: WindowEventsType[K]) => EventEmitter;
  emit: <K extends keyof WindowEventsType>(event: K, ...args: Parameters<WindowEventsType[K]>) => boolean;
};

export function generateBrowserWindowData(win: TabbedBrowserWindow) {
  return {
    id: `browser-${win.id}`,
    type: WindowType.BROWSER,
    window: win.window,
    tabbedBrowserWindow: win
  };
}

function getBrowserWindows(): WindowData[] {
  if (!browser) {
    return [];
  }

  return browser.getWindows().map(generateBrowserWindowData);
}

export function getWindows() {
  const browserWindows = getBrowserWindows();

  return [...browserWindows, ...mainWindows];
}

export function getFocusedWindow() {
  const windows = getWindows();
  return windows.find((window) => window.window.isFocused());
}

export function getWindowById(id: string) {
  return mainWindows.find((window) => window.id === id);
}

export function deleteWindow(id: string) {
  const index = mainWindows.findIndex((window) => window.id === id);
  if (index !== -1) {
    const window = mainWindows[index];
    mainWindows.splice(index, 1);
    windowEvents.emit(WindowEventType.REMOVED, window);
  }
}

export function registerWindow(type: WindowType, id: string, window: BrowserWindow) {
  window.on("closed", () => {
    deleteWindow(id);
  });
  window.on("focus", () => {
    windowEvents.emit(WindowEventType.FOCUSED, window);
  });

  const windowData = { id, type, window };
  mainWindows.push(windowData);
  windowEvents.emit(WindowEventType.ADDED, windowData);
}
