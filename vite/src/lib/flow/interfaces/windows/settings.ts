export type NewTabMode = "omnibox" | "tab";
export type SidebarCollapseMode = "icon" | "offcanvas";

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
   * Gets the current sidebar collapse mode
   */
  getSidebarCollapseMode: () => Promise<SidebarCollapseMode>;

  /**
   * Sets the current sidebar collapse mode
   */
  setSidebarCollapseMode: (mode: SidebarCollapseMode) => Promise<void>;
}
