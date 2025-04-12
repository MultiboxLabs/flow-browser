import { WindowTabsData } from "~/types/tabs";

// API //
export interface FlowTabsAPI {
  /**
   * Get the data for all tabs
   * @returns The data for all tabs
   */
  getData: () => Promise<WindowTabsData>;

  /**
   * Add a callback to be called when the tabs data is updated
   * @param callback The callback to be called when the tabs data is updated
   */
  onDataUpdated: (callback: (data: WindowTabsData) => void) => () => void;
}
