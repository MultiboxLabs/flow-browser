import { clipboard, MenuItemConstructorOptions } from "electron";
import { Browser } from "@/browser/browser";
import { getFocusedWindowData, getTabWc } from "../helpers";

export const createEditMenu = (browser: Browser): MenuItemConstructorOptions => ({
  label: "Edit",
  submenu: [
    { role: "undo" },
    { role: "redo" },
    { type: "separator" },
    { role: "cut" },
    { role: "copy" },
    {
      label: "Copy URL",
      accelerator: "CmdOrCtrl+Shift+C",
      click: () => {
        const winData = getFocusedWindowData();
        if (!winData) return;

        const tabWc = getTabWc(browser, winData);
        if (!tabWc) return;

        const url = tabWc.getURL();
        if (!url) return;

        clipboard.writeText(url);
        // TODO: Show notification to user that the URL has been copied
      }
    },
    { role: "paste" },
    { role: "pasteAndMatchStyle" },
    { role: "delete" },
    { role: "selectAll" }
  ]
});
