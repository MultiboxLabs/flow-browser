import { Menu } from "electron";
import { browser } from "@/browser";
import { createAppMenu } from "@/controllers/app-menu-controller/menu/items/app";
import { createArchiveMenu } from "@/controllers/app-menu-controller/menu/items/archive";
import { createEditMenu } from "@/controllers/app-menu-controller/menu/items/edit";
import { createFileMenu } from "@/controllers/app-menu-controller/menu/items/file";
import { createSpacesMenu } from "@/controllers/app-menu-controller/menu/items/spaces";
import { createViewMenu } from "@/controllers/app-menu-controller/menu/items/view";
import { createWindowMenu } from "@/controllers/app-menu-controller/menu/items/window";
import { MenuItem, MenuItemConstructorOptions } from "electron";
import { spacesEmitter } from "@/sessions/spaces";
import { shortcutsEmitter } from "@/saving/shortcuts";
import { windowEvents, WindowEventType } from "@/modules/windows";

class AppMenuController {
  constructor() {
    this.render();

    spacesEmitter.on("changed", this.render);
    shortcutsEmitter.on("shortcuts-changed", this.render);
    windowEvents.on(WindowEventType.FOCUSED, this.render);
  }

  public async render() {
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
  }
}

export const appMenuController = new AppMenuController();
