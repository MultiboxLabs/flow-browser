import { TabbedBrowserWindow } from "@/browser/window";
import { browser } from "@/index";
import { sendMessageToListenersInWindow } from "@/ipc/listeners-manager";
import { BrowserWindow } from "electron";
import { ipcMain } from "electron";

ipcMain.on("window-button:set-position", (event, position: { x: number; y: number }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && "setWindowButtonPosition" in win) {
    win.setWindowButtonPosition(position);
  }
});

ipcMain.on("window-button:set-visibility", (event, visible: boolean) => {
  const tabbedWindow = browser?.getWindowFromWebContents(event.sender);
  if (tabbedWindow) {
    tabbedWindow.setWindowButtonVisibility(visible);
  }
});

export function toggleSidebar(win: TabbedBrowserWindow) {
  for (const webContents of win.coreWebContents) {
    webContents.send("sidebar:on-toggle");
  }
}

// These methods are only available for popup windows
function moveWindowTo(win: BrowserWindow, x: number, y: number) {
  win.setPosition(x, y);
}

function resizeWindowTo(win: BrowserWindow, width: number, height: number) {
  win.setSize(width, height);
}

ipcMain.on("interface:move-window-by", (event, x: number, y: number) => {
  const win = browser?.getWindowFromWebContents(event.sender);
  if (win && win.type === "popup") {
    const position = win.window.getPosition();
    moveWindowTo(win.window, position[0] + x, position[1] + y);
  }
});

ipcMain.on("interface:move-window-to", (event, x: number, y: number) => {
  const win = browser?.getWindowFromWebContents(event.sender);
  if (win && win.type === "popup") {
    moveWindowTo(win.window, x, y);
  }
});

ipcMain.on("interface:resize-window-by", (event, width: number, height: number) => {
  const win = browser?.getWindowFromWebContents(event.sender);
  if (win && win.type === "popup") {
    const size = win.window.getSize();
    resizeWindowTo(win.window, size[0] + width, size[1] + height);
  }
});

ipcMain.on("interface:resize-window-to", (event, width: number, height: number) => {
  const win = browser?.getWindowFromWebContents(event.sender);
  if (win && win.type === "popup") {
    resizeWindowTo(win.window, width, height);
  }
});

// Window Controls
ipcMain.on("interface:minimize-window", (event) => {
  const win = browser?.getWindowFromWebContents(event.sender);
  if (win) {
    win.window.minimize();
  }
});

ipcMain.on("interface:maximize-window", (event) => {
  const win = browser?.getWindowFromWebContents(event.sender);
  if (win) {
    if (win.window.isMaximized()) {
      win.window.unmaximize();
    } else {
      win.window.maximize();
    }
  }
});

ipcMain.on("interface:close-window", (event) => {
  const win = browser?.getWindowFromWebContents(event.sender);
  if (win) {
    win.window.close();
  }
});

function getWindowState(win: TabbedBrowserWindow) {
  return {
    isMaximized: win.window.isMaximized(),
    isFullscreen: win.window.isFullScreen()
  };
}

ipcMain.handle("interface:get-window-state", (event) => {
  const win = browser?.getWindowFromWebContents(event.sender);
  if (win) {
    return getWindowState(win);
  }
  return false;
});

export function fireWindowStateChanged(win: TabbedBrowserWindow) {
  sendMessageToListenersInWindow(win, "interface:window-state-changed", getWindowState(win));
}
