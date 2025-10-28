import { Menu } from "electron";
import { createAppMenu } from "./menu/items/app";
import { createArchiveMenu } from "./menu/items/archive";
import { createEditMenu } from "./menu/items/edit";
import { createFileMenu } from "./menu/items/file";
import { createSpacesMenu } from "./menu/items/spaces";
import { createViewMenu } from "./menu/items/view";
import { createWindowMenu } from "./menu/items/window";
import { MenuItem, MenuItemConstructorOptions } from "electron";
import { shortcutsEmitter } from "@/saving/shortcuts";
import { spacesController } from "@/controllers/spaces-controller";
import { windowsController } from "@/controllers/windows-controller";

class AppMenuController {
  constructor() {
    this.render();

    spacesController.on("space-created", this.render);
    spacesController.on("space-updated", this.render);
    spacesController.on("space-deleted", this.render);

    shortcutsEmitter.on("shortcuts-changed", this.render);

    // This module hasn't loaded yet, so we have to wait
    setImmediate(() => {
      windowsController.on("window-focused", this.render);
    });
  }

  public async render() {
    const isMac = process.platform === "darwin";

    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      ...(isMac ? [createAppMenu()] : []),
      createFileMenu(),
      createEditMenu(),
      createViewMenu(),
      await createSpacesMenu(),
      createArchiveMenu(),
      createWindowMenu()
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

export const appMenuController = new AppMenuController();
