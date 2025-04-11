import { MenuItemConstructorOptions } from "electron";

export const createWindowMenu = (): MenuItemConstructorOptions => ({
  role: "windowMenu"
});
