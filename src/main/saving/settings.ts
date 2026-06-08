import { getDatastore } from "./datastore";
import { fireOnSettingsChanged } from "@/ipc/window/settings";
import { BasicSettings } from "@/modules/basic-settings";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { BasicSetting, SettingType } from "~/types/settings";
import {
  type SearchSettingsSnapshot,
  getDefaultSearchSettingsSnapshot,
  isSearchEngineSettingId,
  isCustomSearchSuggestionsProviderId,
  isSearchSettingsSnapshotKey,
  validateActiveSearchSettings,
  DEFAULT_SEARCH_SETTINGS_SNAPSHOT
} from "~/search/search-settings";

export const SettingsDataStore = getDatastore("settings");

type SettingsEvents = {
  "settings-changed": [];
};
export const settingsEmitter = new TypedEventEmitter<SettingsEvents>();

// Settings: Current Icon //
// Find in `@/modules/icons.ts`

// Settings: Settings Config //
const basicSettingsCurrentValues: Record<string, SettingType["defaultValue"]> = {};

function getSearchSettingsSnapshotFromValues(
  values: Partial<Record<string, SettingType["defaultValue"]>>
): SearchSettingsSnapshot {
  const defaults = getDefaultSearchSettingsSnapshot();

  return {
    searchEngine: isSearchEngineSettingId(values.searchEngine) ? values.searchEngine : defaults.searchEngine,
    customSearchUrlTemplate:
      typeof values.customSearchUrlTemplate === "string"
        ? values.customSearchUrlTemplate
        : defaults.customSearchUrlTemplate,
    customSearchSuggestionsProvider: isCustomSearchSuggestionsProviderId(values.customSearchSuggestionsProvider)
      ? values.customSearchSuggestionsProvider
      : defaults.customSearchSuggestionsProvider
  };
}

function getNextSearchSettingsSnapshot(settingId: string, value: unknown): SearchSettingsSnapshot | null {
  if (!isSearchSettingsSnapshotKey(settingId)) {
    return null;
  }

  return getSearchSettingsSnapshotFromValues({
    ...basicSettingsCurrentValues,
    [settingId]: value as SettingType["defaultValue"]
  });
}

function wouldCreateInvalidActiveSearchConfiguration(settingId: string, value: unknown): boolean {
  const nextSearchSettings = getNextSearchSettingsSnapshot(settingId, value);
  if (!nextSearchSettings) {
    return false;
  }

  return !validateActiveSearchSettings(nextSearchSettings).valid;
}

function repairInvalidActiveSearchConfiguration() {
  const searchSettings = getSearchSettingsSnapshotFromValues(basicSettingsCurrentValues);
  if (validateActiveSearchSettings(searchSettings).valid) {
    return;
  }

  basicSettingsCurrentValues.searchEngine = DEFAULT_SEARCH_SETTINGS_SNAPSHOT.searchEngine;
  void SettingsDataStore.set("searchEngine", DEFAULT_SEARCH_SETTINGS_SNAPSHOT.searchEngine).catch(() => undefined);
}

function validateSettingValue<T extends SettingType>(setting: T, value: unknown) {
  if (setting.type === "boolean") {
    return typeof value === "boolean";
  }
  if (setting.type === "enum") {
    return setting.options.some((option) => option.id === value);
  }
  if (setting.type === "string") {
    return typeof value === "string";
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
    repairInvalidActiveSearchConfiguration();
    resolve();
  });
});

export const onSettingsCached = () => settingsCachedPromise;

// Export: Get Setting //
export function getSettingValueById(settingId: string): SettingType["defaultValue"] {
  return basicSettingsCurrentValues[settingId];
}

export function getSearchSettingsSnapshot(): SearchSettingsSnapshot {
  return getSearchSettingsSnapshotFromValues(basicSettingsCurrentValues);
}

// Export: Set Setting //
async function setSettingValue<T extends BasicSetting>(setting: T, value: unknown) {
  if (validateSettingValue(setting, value) && !wouldCreateInvalidActiveSearchConfiguration(setting.id, value)) {
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
