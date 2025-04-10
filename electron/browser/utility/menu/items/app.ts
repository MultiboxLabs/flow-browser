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
    { role: "showAllTabs" },
    { type: "separator" },
    { role: "quit" }
  ]
});
