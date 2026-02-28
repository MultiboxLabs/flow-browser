import { Tab, SLEEP_MODE_URL } from "@/controllers/tabs-controller/tab";
import { PreSleepState } from "@/controllers/tabs-controller/tab-lifecycle";
import { TabGroup } from "@/controllers/tabs-controller/tab-groups";
import {
  PersistedTabData,
  PersistedTabGroupData,
  TabData,
  TabGroupData,
  TAB_SCHEMA_VERSION,
  NavigationEntry
} from "~/types/tabs";

/**
 * Removes sleep mode entries from a navigation history array.
 * These entries are synthetic (added by older versions at restore time)
 * and must never be persisted — accumulating them across sessions produces
 * stale pageState blobs that can crash Chromium's image decoders.
 *
 * Note: With the current implementation, sleep mode entries should no longer
 * be created (the view is destroyed instead of navigating to about:blank).
 * This function is kept for backward compatibility with older persisted data.
 *
 * Adjusts navHistoryIndex to account for removed entries before the
 * active index. If the active entry itself is a sleep URL, falls back
 * to the last non-sleep entry.
 */
function stripSleepEntries(
  navHistory: NavigationEntry[],
  navHistoryIndex: number
): { navHistory: NavigationEntry[]; navHistoryIndex: number } {
  const filtered: NavigationEntry[] = [];
  let adjustedIndex = navHistoryIndex;
  let removedBeforeIndex = 0;

  for (let i = 0; i < navHistory.length; i++) {
    if (navHistory[i].url === SLEEP_MODE_URL) {
      if (i < navHistoryIndex) {
        removedBeforeIndex++;
      } else if (i === navHistoryIndex) {
        // Active entry is a sleep URL — will need to pick a fallback
        removedBeforeIndex++; // treat as "before" for index adjustment
      }
      continue;
    }
    filtered.push(navHistory[i]);
  }

  adjustedIndex = navHistoryIndex - removedBeforeIndex;

  // Clamp to valid range
  if (filtered.length === 0) {
    return { navHistory: [], navHistoryIndex: 0 };
  }
  adjustedIndex = Math.max(0, Math.min(adjustedIndex, filtered.length - 1));

  return { navHistory: filtered, navHistoryIndex: adjustedIndex };
}

/**
 * Serializes a Tab instance into PersistedTabData for disk storage.
 * Only includes fields that are meaningful across restarts.
 *
 * @param tab - The tab to serialize
 * @param windowGroupId - The window group ID string (e.g. "w-1")
 * @param preSleepState - Optional pre-sleep state from TabLifecycleManager.
 *   When a tab is asleep, the webContents is destroyed.
 *   The pre-sleep state contains the "real" URL and nav history.
 *
 * To add a new persisted field:
 * 1. Add the field to PersistedTabData in shared/types/tabs.ts
 * 2. Add the serialization here
 */
export function serializeTab(tab: Tab, windowGroupId: string, preSleepState?: PreSleepState | null): PersistedTabData {
  // For sleeping tabs, use the pre-sleep URL/navHistory
  // rather than the webContents data (which would be about:blank?sleep=true)
  const url = preSleepState?.url ?? tab.url;
  const rawNavHistory = preSleepState?.navHistory ?? tab.navHistory;
  const rawNavHistoryIndex = preSleepState?.navHistoryIndex ?? tab.navHistoryIndex;

  // Strip sleep mode entries from nav history — they are synthetic and must
  // never be persisted. Accumulating them across sessions causes stale
  // pageState data that can crash Chromium's image decoders.
  const { navHistory, navHistoryIndex } = stripSleepEntries(rawNavHistory, rawNavHistoryIndex);

  return {
    schemaVersion: TAB_SCHEMA_VERSION,
    uniqueId: tab.uniqueId,
    createdAt: tab.createdAt,
    lastActiveAt: tab.lastActiveAt,
    position: tab.position,

    profileId: tab.profileId,
    spaceId: tab.spaceId,
    windowGroupId,

    title: tab.title,
    url,
    faviconURL: tab.faviconURL,
    muted: tab.muted,

    navHistory,
    navHistoryIndex
  };
}

/**
 * Serializes a Tab instance into TabData for the renderer process.
 * Includes persisted fields (minus navHistory) plus runtime-only fields.
 *
 * navHistory/navHistoryIndex are deliberately excluded — the renderer never
 * reads them and they can be large. Skipping them avoids expensive
 * serialization/IPC on every tab state update during page loads.
 *
 * @param tab - The tab to serialize
 * @param preSleepState - Optional pre-sleep state from TabLifecycleManager
 */
export function serializeTabForRenderer(tab: Tab, preSleepState?: PreSleepState | null): TabData {
  const windowId = tab.getWindow().id;

  // Use pre-sleep URL for sleeping tabs (webContents would show about:blank)
  const url = preSleepState?.url ?? tab.url;

  return {
    // Persisted fields (excluding navHistory/navHistoryIndex)
    schemaVersion: TAB_SCHEMA_VERSION,
    uniqueId: tab.uniqueId,
    createdAt: tab.createdAt,
    lastActiveAt: tab.lastActiveAt,
    position: tab.position,
    profileId: tab.profileId,
    spaceId: tab.spaceId,
    windowGroupId: `w-${windowId}`,
    title: tab.title,
    url,
    faviconURL: tab.faviconURL,
    muted: tab.muted,

    // Runtime-only fields
    id: tab.id,
    windowId,
    isLoading: tab.isLoading,
    audible: tab.audible,
    fullScreen: tab.fullScreen,
    isPictureInPicture: tab.isPictureInPicture,
    asleep: tab.asleep
  };
}

/**
 * Serializes a TabGroup into PersistedTabGroupData for disk storage.
 * References tabs by uniqueId rather than runtime webContents.id.
 */
export function serializeTabGroup(tabGroup: TabGroup): PersistedTabGroupData {
  return {
    groupId: tabGroup.groupId,
    mode: tabGroup.mode,
    profileId: tabGroup.profileId,
    spaceId: tabGroup.spaceId,
    tabUniqueIds: tabGroup.tabs.map((tab) => tab.uniqueId),
    glanceFrontTabUniqueId:
      tabGroup.mode === "glance" ? tabGroup.tabs.find((t) => t.id === tabGroup.frontTabId)?.uniqueId : undefined,
    position: tabGroup.position
  };
}

/**
 * Serializes a TabGroup into TabGroupData for the renderer process.
 * Uses runtime tab IDs for renderer consumption.
 */
export function serializeTabGroupForRenderer(tabGroup: TabGroup): TabGroupData {
  return {
    id: tabGroup.groupId,
    mode: tabGroup.mode,
    profileId: tabGroup.profileId,
    spaceId: tabGroup.spaceId,
    tabIds: tabGroup.tabs.map((tab) => tab.id),
    glanceFrontTabId: tabGroup.mode === "glance" ? tabGroup.frontTabId : undefined,
    position: tabGroup.position
  };
}
