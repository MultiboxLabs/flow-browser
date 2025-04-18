import type { BasicSetting, BasicSettingCard } from "~/types/settings";

// API //
export interface FlowSettingsAPI {
  /**
   * Opens the settings window
   */
  open: () => void;

  /**
   * Closes the settings window
   */
  close: () => void;

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
  onSettingsChanged: (callback: () => void) => () => void;
}
