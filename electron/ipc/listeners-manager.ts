// Manage listeners for IPC channels on the renderer process
// Make sure messages are not wasted by sending to renderer processes that are not listening

import { ipcMain, WebContents } from "electron";

type ListenerMap = Map<string, [WebContents, () => void]>;

const listeners = new Map<string, ListenerMap>();

export function sendMessageToListeners(channel: string, ...args: any[]) {
  const channelListeners = listeners.get(channel);
  if (!channelListeners) return;

  const webContentsSet = new Set<WebContents>();

  for (const [, [webContents, _onDestroyed]] of channelListeners) {
    webContentsSet.add(webContents);
  }

  for (const webContents of webContentsSet) {
    if (webContents.isDestroyed()) {
      continue;
    }
    webContents.send(channel, ...args);
  }
}

function addListener(channel: string, listenerId: string, webContents: WebContents) {
  const channelListeners: ListenerMap = listeners.get(channel) || new Map();

  const onDestroyed = () => {
    removeListener(channel, listenerId);
  };
  webContents.on("destroyed", onDestroyed);

  const removeCallback = () => {
    if (!webContents.isDestroyed) {
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
  addListener(channel, listenerId, webContents);
});

ipcMain.on("listeners:remove", (_event, channel: string, listenerId: string) => {
  removeListener(channel, listenerId);
});
