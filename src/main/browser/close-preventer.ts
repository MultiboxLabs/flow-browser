// Prevent Ctrl+W on Windows from closing the entire window
// So we can process it ourselves by closing the focused tab.

import { type WebContents, webContents } from "electron";
import { menuCloseTab } from "./utility/menu/items/view";
import { browser } from "@/index";

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
  setInterval(() => {
    scan();
  }, 100);
}
