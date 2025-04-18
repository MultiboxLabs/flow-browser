export type TabGroupMode = "normal" | "glance" | "split";

export type NavigationEntry = {
  title: string;
  url: string;
};

export type TabData = {
  id: number;
  profileId: string;
  spaceId: string;
  title: string;
  url: string;
  isLoading: boolean;
  audible: boolean;
  muted: boolean;
  fullScreen: boolean;
  isPictureInPicture: boolean;
  faviconURL: string | null;
  asleep: boolean;
  navHistory: NavigationEntry[];
};

export type TabGroupData = {
  id: number;
  mode: TabGroupMode;
  profileId: string;
  spaceId: string;
  tabIds: number[];
  glanceFrontTabId?: number;
};

export type WindowFocusedTabIds = {
  [spaceId: string]: number;
};

export type WindowActiveTabIds = {
  [spaceId: string]: number[];
};

export type WindowTabsData = {
  tabs: TabData[];
  tabGroups: TabGroupData[];
  focusedTabIds: WindowFocusedTabIds;
  activeTabIds: WindowActiveTabIds;
};
