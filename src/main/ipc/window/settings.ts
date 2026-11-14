import { sendMessageToListeners } from "@/ipc/listeners-manager";
import { BasicSettings, BasicSettingCards } from "@/modules/basic-settings";
import { getSearchSettingsSnapshot, getSettingValueById, setSettingValueById } from "@/saving/settings";
import { settings } from "@/controllers/windows-controller/interfaces/settings";
import { ipcMain } from "electron";
import type { SettingsChangedEvent } from "~/flow/interfaces/settings/settings";

ipcMain.on("settings:open", () => {
  settings.show();
});

ipcMain.on("settings:close", () => {
  settings.hide();
});

ipcMain.handle("settings:get-setting", (_event, settingId: string) => {
  return getSettingValueById(settingId);
});

ipcMain.handle("settings:set-setting", (_event, settingId: string, value: unknown) => {
  return setSettingValueById(settingId, value);
});

ipcMain.handle("settings:get-basic-settings", () => {
  return {
    settings: BasicSettings,
    cards: BasicSettingCards
  };
});

ipcMain.handle("settings:get-search-settings-snapshot", () => {
  return getSearchSettingsSnapshot();
});

ipcMain.on("settings:get-search-settings-snapshot-sync", (event) => {
  event.returnValue = getSearchSettingsSnapshot();
});

export function fireOnSettingsChanged(payload: SettingsChangedEvent) {
  sendMessageToListeners("settings:on-changed", payload);
}
