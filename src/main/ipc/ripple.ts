import { ipcMain } from "electron";
import { rippleService } from "@/modules/ripple/service";
import { sendMessageToListeners } from "@/ipc/listeners-manager";
import type { RippleMode, RippleEvent } from "~/flow/interfaces/ripple/interface";

// Subscribe to Ripple events and forward them to renderer listeners.
rippleService.onEvent((event: RippleEvent) => {
  sendMessageToListeners("ripple:event", event);
});

// Initialize the Ripple OpenCode server.
ipcMain.handle("ripple:initialize", async () => {
  return rippleService.initialize();
});

// Get the current server status.
ipcMain.handle("ripple:get-status", () => {
  return rippleService.getStatus();
});

// Create a new session.
ipcMain.handle("ripple:create-session", async (_event, mode: RippleMode, tabId?: number) => {
  return rippleService.createSession(mode, tabId);
});

// Get or create a session for a specific tab.
ipcMain.handle("ripple:get-or-create-tab-session", async (_event, tabId: number) => {
  return rippleService.getOrCreateTabSession(tabId);
});

// Send a prompt message.
ipcMain.handle("ripple:send-prompt", async (_event, sessionId: string, text: string) => {
  return rippleService.sendPrompt(sessionId, text);
});

// Abort the current generation.
ipcMain.handle("ripple:abort", async (_event, sessionId: string) => {
  return rippleService.abort(sessionId);
});

// List sessions.
ipcMain.handle("ripple:get-sessions", async (_event, mode?: RippleMode) => {
  return rippleService.getSessions(mode);
});

// Get messages for a session.
ipcMain.handle("ripple:get-messages", async (_event, sessionId: string) => {
  return rippleService.getMessages(sessionId);
});

// Toggle filesystem access.
ipcMain.handle("ripple:toggle-fs-access", async (_event, sessionId: string, enabled: boolean) => {
  return rippleService.toggleFsAccess(sessionId, enabled);
});

// Toggle Ripple sidebar (send to browser UI).
ipcMain.on("ripple:toggle-sidebar", (event) => {
  const webContents = event.sender;
  sendMessageToListeners("ripple:on-toggle-sidebar", undefined, [webContents]);
});
