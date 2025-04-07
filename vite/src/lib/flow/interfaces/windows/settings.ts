export type NewTabMode = "omnibox" | "tab";

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
}
