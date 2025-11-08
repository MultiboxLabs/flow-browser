import { MenuItemConstructorOptions } from "electron";
import { getFocusedBrowserWindow } from "../helpers";
import { fireCopyLinkAction } from "@/ipc/app/actions";
import { getCurrentShortcut } from "@/modules/shortcuts";

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
      accelerator: getCurrentShortcut("tab.copyUrl"),
      click: () => {
        const window = getFocusedBrowserWindow();
        if (!window) return;
        return fireCopyLinkAction(window);
      }
    },
    { role: "paste" },
    { role: "pasteAndMatchStyle" },
    { role: "delete" },
    { role: "selectAll" }
  ]
});
