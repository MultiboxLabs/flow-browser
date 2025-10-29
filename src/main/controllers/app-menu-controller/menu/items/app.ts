import { MenuItemConstructorOptions } from "electron";
import { settings } from "@/controllers/windows-controller/interfaces/settings";
import { getCurrentShortcut } from "@/modules/shortcuts";
import { defaultBrowserController } from "@/controllers/default-browser-controller";

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
        defaultBrowserController.setDefaultBrowser();
      },
      checked: defaultBrowserController.isDefaultBrowser(),
      enabled: !defaultBrowserController.isDefaultBrowser()
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
