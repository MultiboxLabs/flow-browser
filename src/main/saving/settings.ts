import { getDatastore } from "./datastore";
import { fireOnSettingsChanged } from "@/ipc/window/settings";
import { BasicSettings } from "@/modules/basic-settings";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { BasicSetting, SettingType } from "~/types/settings";

export const SettingsDataStore = getDatastore("settings");

type SettingsEvents = {
  "settings-changed": [];
};
export const settingsEmitter = new TypedEventEmitter<SettingsEvents>();

// Settings: Current Icon //
// Find in `@/modules/icons.ts`

// Settings: Settings Config //
const basicSettingsCurrentValues: Record<string, SettingType["defaultValue"]> = {};

function validateSettingValue<T extends SettingType>(setting: T, value: unknown) {
  if (setting.type === "boolean") {
    return typeof value === "boolean";
  }
  if (setting.type === "enum") {
    return setting.options.some((option) => option.id === value);
  }
  return false;
}

async function cacheSetting(setting: BasicSetting) {
  const value = await SettingsDataStore.get<SettingType["defaultValue"]>(setting.id).catch(() => undefined);
  if (value !== undefined && validateSettingValue(setting, value)) {
    basicSettingsCurrentValues[setting.id] = value;
  } else {
    basicSettingsCurrentValues[setting.id] = setting.defaultValue;
  }
}

// Cache Settings //
const settingsCachedPromise = new Promise<void>((resolve) => {
  const promises: Promise<void>[] = [];
  for (const setting of BasicSettings) {
    promises.push(cacheSetting(setting));
  }

  Promise.all(promises).then(() => {
    resolve();
  });
});

export const onSettingsCached = () => settingsCachedPromise;

// Export: Get Setting //
export function getSettingValueById(settingId: string): SettingType["defaultValue"] {
  return basicSettingsCurrentValues[settingId];
}

// Export: Set Setting //
async function setSettingValue<T extends BasicSetting>(setting: T, value: unknown) {
  if (validateSettingValue(setting, value)) {
    const saveSuccess = await SettingsDataStore.set(setting.id, value)
      .then(() => true)
      .catch(() => false);

    if (saveSuccess) {
      basicSettingsCurrentValues[setting.id] = value as T["defaultValue"];
      fireOnSettingsChanged();
      settingsEmitter.emit("settings-changed");
      return true;
    }
  }
  return false;
}

export async function setSettingValueById(settingId: string, value: unknown) {
  const setting = BasicSettings.find((setting) => setting.id === settingId);
  if (setting) {
    return setSettingValue(setting, value);
  }
  return false;
}
