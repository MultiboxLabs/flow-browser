import { sendMessageToListeners } from "@/ipc/listeners-manager";
import { BasicSettings, BasicSettingCards } from "@/modules/basic-settings";
import { getSettingValueById, setSettingValueById } from "@/saving/settings";
import { settings } from "@/settings/main";
import { ipcMain } from "electron";

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

export function fireOnSettingsChanged() {
  sendMessageToListeners("settings:on-changed");
}
