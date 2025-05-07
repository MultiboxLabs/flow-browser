import { MenuItemConstructorOptions } from "electron";
import { getFocusedWindowData } from "../helpers";
import { fireCopyLinkAction } from "@/ipc/app/actions";

export const createEditMenu = (): MenuItemConstructorOptions => ({
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
        if (!winData.tabbedBrowserWindow) return;

        return fireCopyLinkAction(winData.tabbedBrowserWindow);
      }
    },
    { role: "paste" },
    { role: "pasteAndMatchStyle" },
    { role: "delete" },
    { role: "selectAll" }
  ]
});
