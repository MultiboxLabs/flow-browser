export type IconData = {
  id: string;
  name: string;
  image_id: string;
  author?: string;
};

export type NewTabMode = "omnibox" | "tab";

// API //
export interface FlowAppAPI {
  /**
   * Gets the app info
   */
  getAppInfo: () => Promise<{
    app_version: string;
    build_number: string;
    node_version: string;
    chrome_version: string;
    electron_version: string;
    os: string;
    update_channel: "Stable" | "Beta" | "Alpha" | "Development";
  }>;

  /**
   * Gets the platform of the current device
   */
  getPlatform: () => string;

  /**
   * Gets the icons
   */
  getIcons: () => Promise<IconData[]>;

  /**
   * Checks if the platform is supported for an icon
   */
  isPlatformSupportedForIcon: () => Promise<boolean>;

  /**
   * Gets the current app icon
   */
  getCurrentIcon: () => Promise<string>;

  /**
   * Sets the current app icon
   */
  setCurrentIcon: (iconId: string) => Promise<boolean>;
}
