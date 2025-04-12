export type TabGroupMode = "normal" | "glance" | "split";

export type TabData = {
  id: number;
  profileId: string;
  spaceId: string;
  title: string;
  url: string;
  isLoading: boolean;
  audible: boolean;
  muted: boolean;
  faviconURL: string | null;
};

export type TabGroupData = {
  id: number;
  mode: TabGroupMode;
  profileId: string;
  spaceId: string;
  tabIds: number[];
  glanceFrontTabId?: number;
};

export type WindowTabsData = {
  tabs: TabData[];
  tabGroups: TabGroupData[];
};
