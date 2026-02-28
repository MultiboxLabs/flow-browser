import { ipcMain } from "electron";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { type PageLayoutParams } from "~/flow/types";

export type PageBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PageBoundsWithWindow = PageBounds & {
  windowId: number;
};

// Legacy path: accepts pre-computed bounds from the renderer.
// Used by the old browser UI which has a different layout structure.
ipcMain.on("page:set-bounds", async (event, bounds: PageBounds) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return;

  window.setPageBounds(bounds);
});

// Declarative path: accepts layout parameters from the renderer.
// The main process computes exact pixel bounds from these parameters
// and the window's content size.
// See design/DECLARATIVE_PAGE_BOUNDS.md for the full design.
ipcMain.on("page:set-layout-params", async (event, params: PageLayoutParams, sentAt?: number) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return;

  window.setLayoutParams(params, sentAt);
});
