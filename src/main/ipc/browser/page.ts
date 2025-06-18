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

const lastBoundsSet = new Map<number, number>();

ipcMain.on("page:set-bounds", async (event, bounds: PageBounds, timestamp: number) => {
  const webContents = event.sender;
  const window = browser?.getWindowFromWebContents(webContents);
  if (!window) return;

  const lastTimestamp = lastBoundsSet.get(window.id);
  if (lastTimestamp && lastTimestamp > timestamp) {
    return;
  }

  lastBoundsSet.set(window.id, timestamp);
  window.setPageBounds(bounds);
});
