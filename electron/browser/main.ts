import { app, BrowserWindow, ipcMain } from "electron";
import { Browser } from "@/browser/browser";
import "@/modules/icons";

// Create browser instance
const browser = new Browser();

// IPC Handlers
ipcMain.on("set-window-button-position", (event, position: { x: number; y: number }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && "setWindowButtonPosition" in win) {
    win.setWindowButtonPosition(position);
  }
});

ipcMain.on("set-window-button-visibility", (event, visible: boolean) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && "setWindowButtonVisibility" in win) {
    win.setWindowButtonVisibility(visible);
  }
});

ipcMain.handle("get-app-info", async () => {
  return {
    version: app.getVersion(),
    packaged: app.isPackaged
  };
});
