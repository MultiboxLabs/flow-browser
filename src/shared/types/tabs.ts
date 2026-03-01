export const TAB_SCHEMA_VERSION = 1;

export type TabGroupMode = "normal" | "glance" | "split";

export type NavigationEntry = {
  title: string;
  url: string;
};

// --- Persisted Data (saved to disk) ---

/**
 * Tab data that is persisted to disk.
 * Does NOT include transient runtime state (isLoading, audible, fullScreen, etc.)
 * or ephemeral IDs (webContents.id, runtime windowId).
 *
 * To add a new persisted field:
 * 1. Add it here
 * 2. Update serializeTab() in saving/tabs/serialization.ts
 */
export type PersistedTabData = {
  schemaVersion: number;
  uniqueId: string;
  createdAt: number;
  lastActiveAt: number;
  position: number;

  profileId: string;
  spaceId: string;
  windowGroupId: string; // logical window grouping key (not runtime Electron window ID)

  title: string;
  url: string;
  faviconURL: string | null;
  muted: boolean;

  navHistory: NavigationEntry[];
  navHistoryIndex: number;
};

/**
 * Tab group data that is persisted to disk.
 * References tabs by uniqueId (persistent) rather than webContents.id (ephemeral).
 */
export type PersistedTabGroupData = {
  groupId: string; // string ID like "tg-0" (avoids collision with tab runtime IDs)
  mode: Exclude<TabGroupMode, "normal">; // "normal" groups are synthetic, never persisted
  profileId: string;
  spaceId: string;
  tabUniqueIds: string[];
  glanceFrontTabUniqueId?: string;
  position: number;
};

// --- Runtime Data (sent to renderer, NOT persisted) ---

/**
 * Full tab data sent to the renderer process.
 * Combines persisted fields with runtime-only fields.
 *
 * navHistory and navHistoryIndex are omitted because the renderer never reads
 * them — navigation history is fetched on demand via `flow.navigation.*`.
 * Excluding them avoids serializing potentially large arrays on every tab
 * state update, which is a significant performance win during page loads.
 */
export type TabData = Omit<PersistedTabData, "navHistory" | "navHistoryIndex"> & {
  id: number; // stable counter-based tab ID (runtime only, NOT webContents.id)
  windowId: number; // current Electron window ID (runtime only)
  isLoading: boolean;
  audible: boolean;
  fullScreen: boolean;
  isPictureInPicture: boolean;
  asleep: boolean;
};

/**
 * Tab group data sent to the renderer process.
 * Uses runtime tab IDs (webContents.id) for renderer consumption.
 */
export type TabGroupData = {
  id: string; // string ID (e.g., "tg-0" for real groups, "s-{uniqueId}" for synthetic)
  mode: TabGroupMode;
  profileId: string;
  spaceId: string;
  tabIds: number[]; // runtime webContents IDs
  glanceFrontTabId?: number;
  position: number;
};

// --- Persisted Window State (saved to disk, one per window) ---

export type PersistedWindowState = {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isPopup?: boolean;
};

// --- Recently Closed ---

export type RecentlyClosedTabData = {
  closedAt: number;
  tabData: PersistedTabData;
  tabGroupData?: PersistedTabGroupData;
};

// --- Window State (renderer) ---

export type WindowFocusedTabIds = {
  [spaceId: string]: number;
};

export type WindowActiveTabIds = {
  [spaceId: string]: number[];
};

/**
 * Maps spaceId → the URL of the focused tab in that space.
 * Populated from ALL tabs (including ephemeral) so the renderer
 * can display the address bar URL even when the focused tab is
 * not in the `tabs` array (e.g. ephemeral pinned-tab tabs).
 */
export type WindowFocusedTabUrls = {
  [spaceId: string]: string;
};

/**
 * Maps spaceId → the isLoading state of the focused tab in that space.
 * Populated from ALL tabs (including ephemeral) so the renderer
 * can display the loading indicator even when the focused tab is
 * not in the `tabs` array (e.g. ephemeral pinned-tab tabs).
 */
export type WindowFocusedTabLoadingStates = {
  [spaceId: string]: boolean;
};

/**
 * Maps spaceId → the fullScreen state of the focused tab in that space.
 * Populated from ALL tabs (including ephemeral) so the renderer
 * can reflect fullscreen state even when the focused tab is
 * not in the `tabs` array (e.g. ephemeral pinned-tab tabs).
 */
export type WindowFocusedTabFullscreenStates = {
  [spaceId: string]: boolean;
};

export type WindowTabsData = {
  tabs: TabData[];
  tabGroups: TabGroupData[];
  focusedTabIds: WindowFocusedTabIds;
  activeTabIds: WindowActiveTabIds;
  focusedTabUrls: WindowFocusedTabUrls;
  focusedTabLoadingStates: WindowFocusedTabLoadingStates;
  focusedTabFullscreenStates: WindowFocusedTabFullscreenStates;
};
