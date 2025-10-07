import { BrowserWindow as ElectronWindow } from "electron";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { ipcMain } from "electron";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";

ipcMain.on("window-button:set-position", (event, position: { x: number; y: number }) => {
  const win = ElectronWindow.fromWebContents(event.sender);
  if (win && "setWindowButtonPosition" in win) {
    win.setWindowButtonPosition(position);
  }
});

ipcMain.on("window-button:set-visibility", (event, visible: boolean) => {
  const tabbedWindow = browserWindowsController.getWindowFromWebContents(event.sender);
  if (tabbedWindow) {
    tabbedWindow.setMacOSTrafficLights(visible);
  }
});

export function toggleSidebar(win: BrowserWindow) {
  win.sendMessageToCoreWebContents("sidebar:on-toggle");
}

// These methods are only available for popup windows
function moveWindowTo(win: ElectronWindow, x: number, y: number) {
  win.setPosition(x, y);
}

function resizeWindowTo(win: ElectronWindow, width: number, height: number) {
  win.setSize(width, height);
}

ipcMain.on("interface:move-window-by", (event, x: number, y: number) => {
  const win = browserWindowsController.getWindowFromWebContents(event.sender);
  if (win && win.browserWindowType === "popup") {
    const electronWindow = win.browserWindow;
    const position = electronWindow.getPosition();
    moveWindowTo(electronWindow, position[0] + x, position[1] + y);
  }
});

ipcMain.on("interface:move-window-to", (event, x: number, y: number) => {
  const win = browserWindowsController.getWindowFromWebContents(event.sender);
  if (win && win.browserWindowType === "popup") {
    moveWindowTo(win.browserWindow, x, y);
  }
});

ipcMain.on("interface:resize-window-by", (event, width: number, height: number) => {
  const win = browserWindowsController.getWindowFromWebContents(event.sender);
  if (win && win.browserWindowType === "popup") {
    const size = win.browserWindow.getSize();
    resizeWindowTo(win.browserWindow, size[0] + width, size[1] + height);
  }
});

ipcMain.on("interface:resize-window-to", (event, width: number, height: number) => {
  const win = browserWindowsController.getWindowFromWebContents(event.sender);
  if (win && win.browserWindowType === "popup") {
    resizeWindowTo(win.browserWindow, width, height);
  }
});

// Window Controls
ipcMain.on("interface:minimize-window", (event) => {
  const win = browserWindowsController.getWindowFromWebContents(event.sender);
  if (win) {
    win.browserWindow.minimize();
  }
});

ipcMain.on("interface:maximize-window", (event) => {
  const win = browserWindowsController.getWindowFromWebContents(event.sender);
  if (win) {
    if (win.browserWindow.isMaximized()) {
      win.browserWindow.unmaximize();
    } else {
      win.browserWindow.maximize();
    }
  }
});

ipcMain.on("interface:close-window", (event) => {
  const win = browserWindowsController.getWindowFromWebContents(event.sender);
  if (win) {
    win.browserWindow.close();
  }
});

function getWindowState(win: BrowserWindow) {
  return {
    isMaximized: win.browserWindow.isMaximized(),
    isFullscreen: win.browserWindow.isFullScreen()
  };
}

ipcMain.handle("interface:get-window-state", (event) => {
  const win = browserWindowsController.getWindowFromWebContents(event.sender);
  if (win) {
    return getWindowState(win);
  }
  return false;
});

export function fireWindowStateChanged(win: BrowserWindow) {
  win.sendMessage("interface:window-state-changed", getWindowState(win));
}
