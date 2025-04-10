import { Menu, type MenuItem, type MenuItemConstructorOptions } from "electron";
import { Browser } from "@/browser/browser";

// Import menu item creation functions
import { createAppMenu } from "./menu/items/app";
import { createFileMenu } from "./menu/items/file";
import { createEditMenu } from "./menu/items/edit";
import { createViewMenu } from "./menu/items/view";
import { createArchiveMenu } from "./menu/items/archive";
import { createWindowMenu } from "./menu/items/window";

export const setupMenu = (browser: Browser) => {
  const isMac = process.platform === "darwin";

  const template: Array<MenuItemConstructorOptions | MenuItem> = [
    ...(isMac ? [createAppMenu()] : []),
    createFileMenu(browser),
    createEditMenu(browser),
    createViewMenu(browser),
    createArchiveMenu(browser),
    createWindowMenu()
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
