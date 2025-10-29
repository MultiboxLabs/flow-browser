import { ipcMain } from "electron";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";

export type PageBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PageBoundsWithWindow = PageBounds & {
  windowId: number;
};

ipcMain.on("page:set-bounds", async (event, bounds: PageBounds) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return;

  window.setPageBounds(bounds);
});
