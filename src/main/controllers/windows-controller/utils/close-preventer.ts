// Prevent Ctrl+W on Windows from closing the entire windows
// So we can process it ourselves by closing the focused tab.

import { app, type WebContents, webContents } from "electron";
import { menuCloseTab } from "@/controllers/app-menu-controller/menu/items/view";
import { browser } from "@/browser";

const enabled = process.platform === "win32";

const registeredWebContentIds: Set<number> = new Set();

function newWebContents(webContents: WebContents) {
  if (!enabled) return;

  if (registeredWebContentIds.has(webContents.id)) return;
  registeredWebContentIds.add(webContents.id);

  webContents.on("before-input-event", (event, input) => {
    if (input.key === "w" && input.control) {
      event.preventDefault();

      if (browser && input.type === "keyDown") {
        menuCloseTab(browser);
      }
    }
  });
}

function scan() {
  webContents.getAllWebContents().forEach((webContents) => {
    newWebContents(webContents);
  });
}

if (enabled) {
  scan();
  app.on("web-contents-created", (_event, webContents) => {
    newWebContents(webContents);
  });
}
