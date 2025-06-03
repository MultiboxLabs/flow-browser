import { MenuItemConstructorOptions } from "electron";
import { settings } from "@/settings/main";
import { isDefaultBrowser, setDefaultBrowser } from "@/modules/default-browser";
import { getCurrentShortcut } from "@/modules/shortcuts";

export const createAppMenu = (): MenuItemConstructorOptions => ({
  role: "appMenu",
  submenu: [
    { role: "about" },
    { type: "separator" },
    {
      label: "Settings",
      accelerator: getCurrentShortcut("browser.openSettings"),
      click: () => {
        settings.show();
      }
    },
    {
      type: "checkbox",
      label: "Set as Default Browser",
      click: () => {
        setDefaultBrowser();
      },
      checked: isDefaultBrowser(),
      enabled: !isDefaultBrowser()
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
