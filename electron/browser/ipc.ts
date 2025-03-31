import { app, BrowserWindow, ipcMain } from "electron";
import "@/modules/icons";
import "@/modules/profiles";
import { getProfiles } from "@/modules/profiles";

// Window Button IPCs //
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

// Settings IPCs //
ipcMain.handle("get-app-info", async () => {
  return {
    version: app.getVersion(),
    packaged: app.isPackaged
  };
});

// Profiles IPCs //
ipcMain.handle("profiles:get-all", async () => {
  return await getProfiles();
});
