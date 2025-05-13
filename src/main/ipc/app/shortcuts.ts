import { sendMessageToListeners } from "@/ipc/listeners-manager";
import { getShortcuts } from "@/modules/shortcuts";
import { resetModifiedShortcut, shortcutsEmitter, updateModifiedShortcut } from "@/saving/shortcuts";
import { ipcMain } from "electron";

ipcMain.handle("shortcuts:get-all", () => {
  const shortcuts = getShortcuts();
  return shortcuts;
});

ipcMain.handle("shortcuts:set", (_event, actionId: string, shortcut: string) => {
  const success = updateModifiedShortcut(actionId, {
    newShortcut: shortcut
  });
  return success;
});

ipcMain.handle("shortcuts:reset", (_event, actionId: string) => {
  const success = resetModifiedShortcut(actionId);
  return success;
});

shortcutsEmitter.on("shortcuts-changed", () => {
  const shortcuts = getShortcuts();
  sendMessageToListeners("shortcuts:on-changed", shortcuts);
});
