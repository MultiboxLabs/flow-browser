import { MenuItemConstructorOptions } from "electron";
import { settings } from "@/settings/main";

export const createAppMenu = (): MenuItemConstructorOptions => ({
  role: "appMenu",
  submenu: [
    { role: "about" },
    { type: "separator" },
    {
      label: "Settings",
      click: () => {
        settings.show();
      }
    },
    { role: "services" },
    { type: "separator" },
    { role: "hide" },
    { role: "hideOthers" },
    { role: "showAllTabs" }, // Note: Changed from showall -> showAllTabs based on likely Electron role
    { type: "separator" },
    { role: "quit" }
  ]
});
