import { IPCListener } from "~/flow/types";
import type { BasicSetting, BasicSettingCard } from "~/types/settings";
import type { SearchSettingsSnapshot } from "~/search/search-settings";

export interface SettingsChangedEvent {
  changedSettingIds: string[];
  searchSettingsSnapshot?: SearchSettingsSnapshot;
}

// API //
export interface FlowSettingsAPI {
  /**
   * Gets the value of a setting
   */
  getSetting<T extends BasicSetting>(settingId: string): Promise<T["defaultValue"]>;

  /**
   * Sets the value of a setting
   */
  setSetting: (settingId: string, value: unknown) => Promise<boolean>;

  /**
   * Gets the basic settings and cards
   */
  getBasicSettings: () => Promise<{
    settings: BasicSetting[];
    cards: BasicSettingCard[];
  }>;

  /**
   * Gets the normalized search settings snapshot.
   */
  getSearchSettingsSnapshot: () => Promise<SearchSettingsSnapshot>;

  /**
   * Synchronously gets the current normalized search settings snapshot.
   * Used by startup-critical search plumbing that cannot wait for async IPC.
   */
  getSearchSettingsSnapshotSync: () => SearchSettingsSnapshot;

  /**
   * Listens for changes to the settings */
  onSettingsChanged: IPCListener<[SettingsChangedEvent]>;
}
