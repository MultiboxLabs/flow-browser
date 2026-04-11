// When focus is in a tab WebContents, application menu accelerators may not run.
// Handle Control+Tab / Control+Shift+Tab here so tab cycling matches the menu actions.

import { app, webContents, type WebContents } from "electron";
import { menuNextTab, menuPreviousTab } from "@/controllers/app-menu-controller/menu/items/tabs";

const registeredWebContentIds = new Set<number>();

function registerTabCycleShortcuts(wc: WebContents) {
  if (registeredWebContentIds.has(wc.id)) return;
  registeredWebContentIds.add(wc.id);

  wc.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown" || input.key !== "Tab" || !input.control) {
      return;
    }

    event.preventDefault();

    if (input.shift) {
      menuPreviousTab();
    } else {
      menuNextTab();
    }
  });
}

function scan() {
  webContents.getAllWebContents().forEach((wc) => {
    registerTabCycleShortcuts(wc);
  });
}

scan();
app.on("web-contents-created", (_event, wc) => {
  registerTabCycleShortcuts(wc);
});
