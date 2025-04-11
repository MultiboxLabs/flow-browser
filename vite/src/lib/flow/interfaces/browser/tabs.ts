export type TabData = {
  id: number;
  profileId: string;
  spaceId: string;
  active: boolean;
};

export type ActiveTabData = {
  profileId: string;
  mode: "standard" | "glance" | "split";
  tabs: TabData[];
};

export type FocusedTabData = {
  profileId: string;
  tabId: number;
};

type WindowTabsData = {
  tabs: TabData[];
  active: ActiveTabData[];
  focusedTabId: FocusedTabData;
};

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
  onDataUpdated: (callback: (data: WindowTabsData) => void) => void;
}
