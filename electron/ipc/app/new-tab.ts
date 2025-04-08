import { NewTabMode, getCurrentNewTabMode, setCurrentNewTabMode } from "@/saving/settings";
import { ipcMain } from "electron";

ipcMain.handle("new-tab-mode:get", () => {
  return getCurrentNewTabMode();
});

ipcMain.handle("new-tab-mode:set", (_, newTabMode: NewTabMode) => {
  return setCurrentNewTabMode(newTabMode);
});
