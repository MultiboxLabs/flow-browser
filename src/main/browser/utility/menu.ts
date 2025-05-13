import { Menu, type MenuItem, type MenuItemConstructorOptions } from "electron";
import { Browser } from "@/browser/browser";

// Import menu item creation functions
import { createAppMenu } from "./menu/items/app";
import { createFileMenu } from "./menu/items/file";
import { createEditMenu } from "./menu/items/edit";
import { createViewMenu } from "./menu/items/view";
import { createArchiveMenu } from "./menu/items/archive";
import { createWindowMenu } from "./menu/items/window";
import { createSpacesMenu } from "@/browser/utility/menu/items/spaces";
import { spacesEmitter } from "@/sessions/spaces";
import { windowEvents, WindowEventType } from "@/modules/windows";
import { shortcutsEmitter } from "@/saving/shortcuts";

export const setupMenu = (browser: Browser) => {
  const craftMenu = async () => {
    const isMac = process.platform === "darwin";

    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      ...(isMac ? [createAppMenu()] : []),
      createFileMenu(browser),
      createEditMenu(),
      createViewMenu(browser),
      await createSpacesMenu(),
      createArchiveMenu(browser),
      createWindowMenu()
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  };

  craftMenu();
  spacesEmitter.on("changed", craftMenu);
  shortcutsEmitter.on("shortcuts-changed", craftMenu);
  windowEvents.on(WindowEventType.FOCUSED, craftMenu);

  return craftMenu;
};
