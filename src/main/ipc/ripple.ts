import { ipcMain } from "electron";
import { rippleService } from "@/modules/ripple/service";
import { sendMessageToListeners } from "@/ipc/listeners-manager";

// Initialize the Ripple OpenCode server. Returns { url } or null.
ipcMain.handle("ripple:initialize", async () => {
  return rippleService.initialize();
});

// Get the current server status.
ipcMain.handle("ripple:get-status", () => {
  return rippleService.getStatus();
});

// Get the server URL.
ipcMain.handle("ripple:get-server-url", () => {
  return rippleService.getServerUrl();
});

// Toggle Ripple sidebar (send to browser UI).
ipcMain.on("ripple:toggle-sidebar", (event) => {
  const webContents = event.sender;
  sendMessageToListeners("ripple:on-toggle-sidebar", undefined, [webContents]);
});
