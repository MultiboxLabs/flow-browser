import { MenuItemConstructorOptions } from "electron";
import { getFocusedBrowserWindow } from "../helpers";
import { tabService } from "@/services/tab-service";
import { getCurrentShortcut } from "@/modules/shortcuts";

export function menuNextTab() {
  const window = getFocusedBrowserWindow();
  const spaceId = window?.currentSpaceId;
  if (!window || !spaceId) return;
  tabService.activateNextTab(window.id, spaceId);
}

export function menuPreviousTab() {
  const window = getFocusedBrowserWindow();
  const spaceId = window?.currentSpaceId;
  if (!window || !spaceId) return;
  tabService.activatePreviousTab(window.id, spaceId);
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
