import { type BrowserWindow } from "electron";
import { browser } from "../index";
import { TabbedBrowserWindow } from "../browser/main";

export type WindowData = {
  id: string;
  type: WindowType;
  window: BrowserWindow;
  tabbedBrowserWindow?: TabbedBrowserWindow;
};
const mainWindows: WindowData[] = [];

export enum WindowType {
  BROWSER = "browser",
  SETTINGS = "settings"
}

function getBrowserWindows(): WindowData[] {
  if (!browser) {
    return [];
  }

  return browser.getWindows().map((win) => {
    return {
      id: `browser-${win.id}`,
      type: WindowType.BROWSER,
      window: win.getBrowserWindow(),
      tabbedBrowserWindow: win
    };
  });
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
    mainWindows.splice(index, 1);
  }
}

export function registerWindow(type: WindowType, id: string, window: BrowserWindow) {
  window.on("closed", () => {
    deleteWindow(id);
  });

  mainWindows.push({ id, type, window });
}
