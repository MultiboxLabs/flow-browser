import { IPCListener } from "~/flow/types";
import type { BasicSetting, BasicSettingCard } from "~/types/settings";

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
   * Listens for changes to the settings */
  onSettingsChanged: IPCListener<[void]>;
}
