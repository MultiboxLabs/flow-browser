// Manage listeners for IPC channels on the renderer process
// Make sure messages are not wasted by sending to renderer processes that are not listening

/* eslint-disable @typescript-eslint/no-explicit-any */

import { appendFileSync } from "node:fs";
import { ipcMain, WebContents } from "electron";

type ListenerMap = Map<string, [WebContents, () => void]>;

const listeners = new Map<string, ListenerMap>();

function writeDebugLog(payload: {
  hypothesisId: string;
  location: string;
  message: string;
  data: Record<string, unknown>;
}) {
  appendFileSync("/opt/cursor/logs/debug.log", JSON.stringify({ ...payload, timestamp: Date.now() }) + "\n");
}

// Utility Functions //
function getConnectedWebContents(channel: string) {
  const webContentsSet = new Set<WebContents>();

  const channelListeners = listeners.get(channel);
  if (!channelListeners) return webContentsSet;

  for (const [, [webContents]] of channelListeners) {
    webContentsSet.add(webContents);
  }

  return webContentsSet;
}

function sendMessageToWebContents(webContents: WebContents, channel: string, ...args: any[]) {
  if (webContents.isDestroyed()) {
    return false;
  }
  webContents.send(channel, ...args);
  return true;
}

// Public Functions //
export function sendMessageToListeners(channel: string, ...args: any[]) {
  const webContentsSet = getConnectedWebContents(channel);

  for (const webContents of webContentsSet) {
    if (webContents.isDestroyed()) {
      continue;
    }
    sendMessageToWebContents(webContents, channel, ...args);
  }
}

export function sendMessageToListenersWithWebContents(
  selectedWebContents: WebContents[],
  channel: string,
  ...args: any[]
) {
  const webContentsSet = getConnectedWebContents(channel);

  if (channel === "tabs:on-switcher-state-changed") {
    // #region agent log
    writeDebugLog({
      hypothesisId: "B",
      location: "src/main/ipc/listeners-manager.ts:sendMessageToListenersWithWebContents",
      message: "Sending switcher state to scoped listeners",
      data: {
        selectedWebContentsIds: selectedWebContents.map((webContents) => webContents.id),
        connectedWebContentsIds: Array.from(webContentsSet).map((webContents) => webContents.id)
      }
    });
    // #endregion
  }

  for (const webContents of selectedWebContents) {
    if (webContents.isDestroyed()) {
      continue;
    }
    if (webContentsSet.has(webContents)) {
      sendMessageToWebContents(webContents, channel, ...args);
    }
  }
}

// Internal Functions //
function addListener(channel: string, listenerId: string, webContents: WebContents) {
  const channelListeners: ListenerMap = listeners.get(channel) || new Map();

  const onDestroyed = () => {
    removeListener(channel, listenerId);
  };
  webContents.on("destroyed", onDestroyed);

  const removeCallback = () => {
    if (!webContents.isDestroyed()) {
      webContents.off("destroyed", onDestroyed);
    }
  };

  channelListeners.set(listenerId, [webContents, removeCallback]);
  listeners.set(channel, channelListeners);
}

function removeListener(channel: string, listenerId: string) {
  const channelListeners = listeners.get(channel);
  if (!channelListeners) return;

  const data = channelListeners.get(listenerId);
  if (data) {
    const [, removeCallback] = data;
    removeCallback();
    channelListeners.delete(listenerId);
    listeners.set(channel, channelListeners);
  }
}

ipcMain.on("listeners:add", (event, channel: string, listenerId: string) => {
  const webContents = event.sender;
  if (channel === "tabs:on-switcher-state-changed") {
    // #region agent log
    writeDebugLog({
      hypothesisId: "B",
      location: "src/main/ipc/listeners-manager.ts:listeners:add",
      message: "Registered switcher listener",
      data: {
        listenerId,
        webContentsId: webContents.id
      }
    });
    // #endregion
  }
  addListener(channel, listenerId, webContents);
});

ipcMain.on("listeners:remove", (_event, channel: string, listenerId: string) => {
  removeListener(channel, listenerId);
});
