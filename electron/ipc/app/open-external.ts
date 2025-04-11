import { getAlwaysOpenExternal, unsetAlwaysOpenExternal } from "@/saving/open-external";
import { ipcMain } from "electron";

ipcMain.handle("open-external:get", () => {
  return getAlwaysOpenExternal();
});

ipcMain.handle("open-external:unset", (_, requestingURL: string, openingURL: string) => {
  return unsetAlwaysOpenExternal(requestingURL, openingURL);
});
