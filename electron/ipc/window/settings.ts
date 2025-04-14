import { getCurrentSidebarCollapseMode, setCurrentSidebarCollapseMode, SidebarCollapseMode } from "@/saving/settings";
import { settings } from "@/settings/main";
import { ipcMain } from "electron";

ipcMain.on("settings:open", () => {
  settings.show();
});

ipcMain.on("settings:close", () => {
  settings.hide();
});

// Settings: Sidebar Collapse Mode //
ipcMain.handle("settings:get-sidebar-collapse-mode", () => {
  return getCurrentSidebarCollapseMode();
});

ipcMain.handle("settings:set-sidebar-collapse-mode", (event, mode: SidebarCollapseMode) => {
  return setCurrentSidebarCollapseMode(mode);
});
