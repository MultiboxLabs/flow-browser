import { icons, setCurrentIconId, supportedPlatforms, type IconId, getCurrentIconId } from "@/modules/icons";
import { ipcMain } from "electron";

ipcMain.handle("icons:get-all", () => {
  return icons;
});

ipcMain.handle("icons:is-platform-supported", () => {
  return supportedPlatforms.includes(process.platform);
});

ipcMain.handle("icons:get-current-icon-id", () => {
  return getCurrentIconId();
});

ipcMain.handle("icons:set-current-icon-id", (_, iconId: IconId) => {
  return setCurrentIconId(iconId);
});
