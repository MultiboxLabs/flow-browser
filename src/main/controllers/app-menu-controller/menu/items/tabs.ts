import { MenuItemConstructorOptions } from "electron";
import { getFocusedBrowserWindow } from "../helpers";
import { tabsController } from "@/controllers/tabs-controller";
import { getCurrentShortcut } from "@/modules/shortcuts";

export function menuNextTab() {
  const window = getFocusedBrowserWindow();
  const spaceId = window?.currentSpaceId;
  if (!window || !spaceId) return;
  tabsController.activateNextTabInSpace(window.id, spaceId);
}

export function menuPreviousTab() {
  const window = getFocusedBrowserWindow();
  const spaceId = window?.currentSpaceId;
  if (!window || !spaceId) return;
  tabsController.activatePreviousTabInSpace(window.id, spaceId);
}

export const createTabsMenu = (): MenuItemConstructorOptions => ({
  label: "Tabs",
  submenu: [
    {
      label: "Next Tab",
      accelerator: getCurrentShortcut("tabs.next"),
      click: menuNextTab
    },
    {
      label: "Previous Tab",
      accelerator: getCurrentShortcut("tabs.previous"),
      click: menuPreviousTab
    }
  ]
});
