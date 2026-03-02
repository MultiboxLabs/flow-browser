// Generic window control IPC handlers.
// These use Electron's BrowserWindow.fromWebContents() so they work for
// ANY window type (browser, settings, etc.), unlike the browser-specific
// handlers in ipc/browser/interface.ts.

import { BrowserWindow, ipcMain } from "electron";
import { windowsController } from "@/controllers/windows-controller";
import { sendMessageToListenersWithWebContents } from "@/ipc/listeners-manager";
import type { WindowState } from "~/flow/types";

function getWindowState(win: BrowserWindow): WindowState {
  return {
    isMaximized: win.isMaximized(),
    isFullscreen: win.isFullScreen()
  };
}

function fireGenericWindowStateChanged(win: BrowserWindow) {
  const state = getWindowState(win);
  sendMessageToListenersWithWebContents([win.webContents], "window:state-changed", state);
}

// Minimize
ipcMain.on("window:minimize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.minimize();
  }
});

// Maximize / Restore
ipcMain.on("window:maximize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

// Close
ipcMain.on("window:close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
  }
});

// Get State
ipcMain.handle("window:get-state", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    return getWindowState(win);
  }
  return false;
});

// State change notifications — attach listeners to every window that
// gets registered with the WindowsController.
windowsController.on("window-added", (_id, baseWindow) => {
  const bw = baseWindow.browserWindow;

  const notify = () => {
    if (!bw.isDestroyed()) {
      fireGenericWindowStateChanged(bw);
    }
  };

  bw.on("maximize", notify);
  bw.on("unmaximize", notify);
  bw.on("enter-full-screen", notify);
  bw.on("leave-full-screen", notify);
});
