import { z } from "zod";
import { getDatastore } from "./datastore";

export const SettingsDataStore = getDatastore("settings");

// Settings: Current Icon //
// Find in `@/modules/icons.ts`

// Settings: New Tab Mode //
export const NewTabModeSchema = z.enum(["omnibox", "tab"]);
export type NewTabMode = z.infer<typeof NewTabModeSchema>;

let currentNewTabMode: NewTabMode = "omnibox";

async function cacheNewTabMode() {
  // Use default value if error raised
  const iconId = await SettingsDataStore.get<NewTabMode>("newTabMode").catch(() => null);

  const parseResult = NewTabModeSchema.safeParse(iconId);
  if (parseResult.success) {
    currentNewTabMode = parseResult.data;
  }
}
cacheNewTabMode();

export function getCurrentNewTabMode() {
  return currentNewTabMode;
}
export async function setCurrentNewTabMode(newTabMode: NewTabMode) {
  const parseResult = NewTabModeSchema.safeParse(newTabMode);
  if (parseResult.success) {
    const saveSuccess = await SettingsDataStore.set("newTabMode", newTabMode)
      .then(() => true)
      .catch(() => false);

    if (saveSuccess) {
      currentNewTabMode = newTabMode;
      return true;
    }
  }
  return false;
}

// Settings: Sidebar Collapse Mode //
export const SidebarCollapseModeSchema = z.enum(["icon", "offcanvas"]);
export type SidebarCollapseMode = z.infer<typeof SidebarCollapseModeSchema>;

let currentSidebarCollapseMode: SidebarCollapseMode = "icon";

async function cacheSidebarCollapseMode() {
  // Use default value if error raised
  const mode = await SettingsDataStore.get<SidebarCollapseMode>("sidebarCollapseMode").catch(() => null);

  const parseResult = SidebarCollapseModeSchema.safeParse(mode);
  if (parseResult.success) {
    currentSidebarCollapseMode = parseResult.data;
  }
}
cacheSidebarCollapseMode();

export function getCurrentSidebarCollapseMode() {
  return currentSidebarCollapseMode;
}
export async function setCurrentSidebarCollapseMode(newTabMode: SidebarCollapseMode) {
  const parseResult = SidebarCollapseModeSchema.safeParse(newTabMode);
  if (parseResult.success) {
    const saveSuccess = await SettingsDataStore.set("sidebarCollapseMode", newTabMode)
      .then(() => true)
      .catch(() => false);

    if (saveSuccess) {
      currentSidebarCollapseMode = newTabMode;
      return true;
    }
  }
  return false;
}
