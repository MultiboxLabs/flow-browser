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
   * Writes text to the clipboard
   */
  writeTextToClipboard: (text: string) => void;

  /**
   * Sets the default browser
   */
  setDefaultBrowser: () => Promise<boolean>;

  /**
   * Gets the default browser
   */
  getDefaultBrowser: () => Promise<boolean>;
}
