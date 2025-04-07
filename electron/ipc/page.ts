import { ipcMain } from "electron";
import { browser } from "@/index";

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
  const window = browser?.getWindowFromWebContents(webContents);
  if (!window) return null;

  // Add the window ID to the bounds
  const boundsWithWindow: PageBoundsWithWindow = {
    ...bounds,
    windowId: window.id
  };

  // Notify renderer of the change
  event.sender.send("page:bounds-updated", boundsWithWindow);
});
