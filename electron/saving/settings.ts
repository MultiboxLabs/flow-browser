import { z } from "zod";
import { DataStore } from "./datastore";
import { ipcMain } from "electron";

export const SettingsDataStore = new DataStore("settings");

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

ipcMain.handle("get-current-new-tab-mode", () => {
  return getCurrentNewTabMode();
});

ipcMain.handle("set-current-new-tab-mode", (_, newTabMode: NewTabMode) => {
  return setCurrentNewTabMode(newTabMode);
});
