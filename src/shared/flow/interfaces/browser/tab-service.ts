import { IPCListener } from "~/flow/types";
import {
  TabData,
  TabLayoutNodeData,
  WindowTabsPayload,
  PinnedTabData,
  RecentlyClosedTabData,
  TabPlaceholderUpdate,
  TabTargetUrlUpdate
} from "~/types/tab-service";

/**
 * Flow Tab Service API — the renderer-facing interface for tab management.
 *
 * Replaces the old FlowTabsAPI and FlowPinnedTabsAPI with a unified,
 * clean API surface.
 */
export interface FlowTabServiceAPI {
  // --- Data Queries ---

  /** Get the full tabs payload for this window. */
  getData: () => Promise<WindowTabsPayload>;

  /** Full data refresh (structural changes: tab created/removed, active changed). */
  onDataUpdated: IPCListener<[WindowTabsPayload]>;

  /** Lightweight content-only updates (title, url, isLoading, etc.). */
  onContentUpdated: IPCListener<[TabData[]]>;

  /** Tab-sync screenshot placeholder updates. */
  onPlaceholderChanged: IPCListener<[TabPlaceholderUpdate]>;

  /** Hover link target URL updates (Chrome-like status bar). */
  onTargetUrlChanged: IPCListener<[TabTargetUrlUpdate]>;

  // --- Tab Operations ---

  /** Switch to (activate) a tab by ID. */
  switchToTab: (tabId: number) => Promise<boolean>;

  /** Create a new tab. */
  newTab: (url?: string, isForeground?: boolean, spaceId?: string, typedFromAddressBar?: boolean) => Promise<boolean>;

  /** Close a tab by ID. */
  closeTab: (tabId: number) => Promise<boolean>;

  /** Set muted state. */
  setTabMuted: (tabId: number, muted: boolean) => Promise<boolean>;

  /** Move a tab to a new position. */
  moveTab: (tabId: number, newPosition: number) => Promise<boolean>;

  /** Move a tab to a different space. */
  moveTabToSpace: (tabId: number, spaceId: string, newPosition?: number) => Promise<boolean>;

  /** Batch move multiple tabs to a space. */
  batchMoveTabs: (tabIds: number[], spaceId: string, newPositionStart?: number) => Promise<boolean>;

  /** Show context menu for a tab. */
  showContextMenu: (tabId: number) => void;

  /** Disable picture-in-picture. */
  disablePictureInPicture: (goBackToTab: boolean) => Promise<boolean>;

  // --- Recently Closed ---

  /** Get all recently closed tabs. */
  getRecentlyClosed: () => Promise<RecentlyClosedTabData[]>;

  /** Restore a recently closed tab. */
  restoreRecentlyClosed: (uniqueId: string) => Promise<boolean>;

  /** Clear all recently closed tabs. */
  clearRecentlyClosed: () => Promise<boolean>;

  // --- Layout Node Operations ---

  /** Create a multi-tab layout node (glance or split). */
  createLayoutNode: (mode: "glance" | "split", tabIds: number[]) => Promise<TabLayoutNodeData | null>;

  /** Dissolve a layout node back to individual tabs. */
  dissolveLayoutNode: (nodeId: string) => Promise<boolean>;

  // --- Pinned Tabs ---

  /** Get all pinned tabs grouped by profile ID. */
  getPinnedTabs: () => Promise<Record<string, PinnedTabData[]>>;

  /** Listen for pinned tab changes. */
  onPinnedTabsChanged: IPCListener<[Record<string, PinnedTabData[]>]>;

  /** Create a pinned tab from an existing browser tab. */
  createPinnedTabFromTab: (tabId: number, position?: number) => Promise<PinnedTabData | null>;

  /** Click a pinned tab (activate or create associated tab). */
  clickPinnedTab: (pinnedTabId: string) => Promise<boolean>;

  /** Double-click a pinned tab (navigate to default URL). */
  doubleClickPinnedTab: (pinnedTabId: string) => Promise<boolean>;

  /** Remove a pinned tab. */
  removePinnedTab: (pinnedTabId: string) => Promise<boolean>;

  /** Unpin back to tab list. */
  unpinToTabList: (pinnedTabId: string, position?: number) => Promise<boolean>;

  /** Reorder a pinned tab. */
  reorderPinnedTab: (pinnedTabId: string, newPosition: number) => Promise<boolean>;

  /** Show context menu for a pinned tab. */
  showPinnedTabContextMenu: (pinnedTabId: string) => void;
}
