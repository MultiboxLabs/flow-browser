export type NewTabMode = "omnibox" | "tab";

// API //
export interface FlowNewTabAPI {
  /**
   * Gets the current new tab mode
   */
  getCurrentNewTabMode: () => Promise<NewTabMode>;

  /**
   * Sets the current new tab mode
   */
  setCurrentNewTabMode: (newTabMode: NewTabMode) => Promise<boolean>;

  /**
   * Opens a new tab
   */
  open: () => Promise<void>;
}
