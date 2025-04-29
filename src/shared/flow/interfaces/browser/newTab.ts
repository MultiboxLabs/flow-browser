export type NewTabMode = "omnibox" | "tab";

// API //
export interface FlowNewTabAPI {
  /**
   * Opens a new tab
   */
  open: () => void;
}
