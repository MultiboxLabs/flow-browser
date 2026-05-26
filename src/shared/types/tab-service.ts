/**
 * Tab Service v2 — Shared Types
 *
 * These types define the contract between main process (TabService)
 * and renderer process (providers/IPCs).
 */

export const TAB_SERVICE_SCHEMA_VERSION = 2;

// --- Tab Types ---

export type NavigationEntry = {
  title: string;
  url: string;
  pageState?: string;
};

/**
 * How a tab was opened / what it's linked to.
 * - "normal": Standard tab with no special linkage.
 * - "pinned": Tab is owned by a PinnedTab. Ephemeral (not persisted independently).
 * - "bookmark": (Future) Tab is owned by a Bookmark. Ephemeral.
 */
export type TabOwnerKind = "normal" | "pinned" | "bookmark";

/**
 * Reference to the entity that owns this tab (if not "normal").
 */
export type TabOwnerRef =
  | { kind: "normal" }
  | { kind: "pinned"; pinnedTabId: string }
  | { kind: "bookmark"; bookmarkId: string };

/**
 * Persisted tab data saved to disk.
 * Does NOT include transient runtime state.
 */
export type PersistedTabData = {
  schemaVersion: number;
  uniqueId: string;
  createdAt: number;
  lastActiveAt: number;
  position: number;

  profileId: string;
  spaceId: string;
  windowGroupId: string;

  title: string;
  url: string;
  faviconURL: string | null;
  muted: boolean;

  navHistory: NavigationEntry[];
  navHistoryIndex: number;

  owner: TabOwnerRef;
};

/**
 * Runtime tab data sent to the renderer.
 * Excludes navHistory (fetched on demand) and adds runtime fields.
 */
export type TabData = Omit<PersistedTabData, "navHistory" | "navHistoryIndex"> & {
  id: number;
  windowId: number;
  isLoading: boolean;
  audible: boolean;
  fullScreen: boolean;
  isPictureInPicture: boolean;
  asleep: boolean;
};

// --- Tab Layout Node Types ---

/**
 * A TabLayoutNode represents tabs that are displayed together.
 * In the old system this was called a "TabGroup" with modes (glance, split).
 * In the new system we explicitly define layout node types.
 */
export type TabLayoutNodeMode = "single" | "glance" | "split";

export type TabLayoutNodeData = {
  id: string;
  mode: TabLayoutNodeMode;
  tabIds: number[];
  /** For glance mode: which tab is shown in front */
  frontTabId?: number;
  position: number;
  spaceId: string;
  profileId: string;
};

/**
 * Persisted tab layout node data.
 */
export type PersistedTabLayoutNodeData = {
  id: string;
  mode: Exclude<TabLayoutNodeMode, "single">;
  tabUniqueIds: string[];
  frontTabUniqueId?: string;
  position: number;
  spaceId: string;
  profileId: string;
};

// --- Tab Group Types (folder-like grouping) ---

/**
 * TabGroup is a logical folder-like grouping of tabs.
 * This is NOT the same as the old TabGroup (which is now TabLayoutNode).
 * TabGroups in v2 are for organizing tabs (like Chrome's tab groups with colors/labels).
 * NOTE: This is a future feature placeholder. Not implemented yet.
 */
export type TabGroupData = {
  id: string;
  name: string;
  color: string;
  tabIds: number[];
  collapsed: boolean;
  spaceId: string;
  profileId: string;
};

// --- Pinned Tab Types ---

export type PersistedPinnedTabData = {
  uniqueId: string;
  profileId: string;
  defaultUrl: string;
  faviconUrl: string | null;
  position: number;
};

export type PinnedTabData = PersistedPinnedTabData & {
  /** Runtime: map of spaceId -> associated tab ID */
  associatedTabIds: Record<string, number>;
};

// --- Window State Types ---

export type PersistedWindowState = {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isPopup?: boolean;
};

// --- Aggregate Data sent to Renderer ---

export type WindowFocusedTabIds = {
  [spaceId: string]: number;
};

export type WindowActiveLayoutNodeIds = {
  [spaceId: string]: string;
};

export type WindowTabsPayload = {
  tabs: TabData[];
  layoutNodes: TabLayoutNodeData[];
  focusedTabIds: WindowFocusedTabIds;
  activeLayoutNodeIds: WindowActiveLayoutNodeIds;
};

// --- Recently Closed ---

export type RecentlyClosedTabData = {
  closedAt: number;
  tabData: PersistedTabData;
  layoutNodeData?: PersistedTabLayoutNodeData;
};

// --- Placeholder & Target URL (for tab sync) ---

export type TabPlaceholderUpdate = {
  snapshotId: string | null;
  generation: number;
  spaceId: string | null;
};

export type TabTargetUrlUpdate = {
  tabId: number;
  windowId: number;
  url: string;
};
