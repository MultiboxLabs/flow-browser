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
 * These entries are synthetic (added at restore time) and must never
 * be persisted — accumulating them across sessions produces stale
 * pageState blobs that can crash Chromium's image decoders.
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
 *   When a tab is asleep, webContents shows about:blank?sleep=true.
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

  // Capture window bounds and type for restoring window size/position
  let windowWidth: number | undefined;
  let windowHeight: number | undefined;
  let windowX: number | undefined;
  let windowY: number | undefined;
  let windowIsPopup: boolean | undefined;

  try {
    const win = tab.getWindow();
    const bounds = win.browserWindow.getBounds();
    windowWidth = bounds.width;
    windowHeight = bounds.height;
    windowX = bounds.x;
    windowY = bounds.y;
    windowIsPopup = win.browserWindowType === "popup" ? true : undefined;
  } catch {
    // Tab's window may already be destroyed; skip window state
  }

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
    navHistoryIndex,

    windowWidth,
    windowHeight,
    windowX,
    windowY,
    windowIsPopup
  };
}

/**
 * Serializes a Tab instance into full TabData for the renderer process.
 * Includes both persisted and runtime-only fields.
 *
 * @param tab - The tab to serialize
 * @param preSleepState - Optional pre-sleep state from TabLifecycleManager
 */
export function serializeTabForRenderer(tab: Tab, preSleepState?: PreSleepState | null): TabData {
  const windowId = tab.getWindow().id;
  const windowGroupId = `w-${windowId}`;

  return {
    // Persisted fields
    ...serializeTab(tab, windowGroupId, preSleepState),

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

/**
 * Migrates old tab data (schema version 0 / no version) to the current schema.
 * Called during tab loading to handle backwards compatibility.
 *
 * Also strips any sleep mode entries from navHistory — these are synthetic
 * entries that should never have been persisted but may exist in data from
 * older versions.
 */
export function migrateTabData(data: Record<string, unknown>): PersistedTabData {
  const version = (data.schemaVersion as number) ?? 0;

  let migrated: PersistedTabData;

  if (version === 0) {
    // v0 -> v1: Add schemaVersion, convert windowId to windowGroupId, remove transient fields
    const windowId = data.windowId as number | undefined;
    migrated = {
      schemaVersion: TAB_SCHEMA_VERSION,
      uniqueId: (data.uniqueId as string) || "",
      createdAt: (data.createdAt as number) || 0,
      lastActiveAt: (data.lastActiveAt as number) || 0,
      position: (data.position as number) || 0,

      profileId: (data.profileId as string) || "",
      spaceId: (data.spaceId as string) || "",
      windowGroupId: windowId !== undefined ? `w-${windowId}` : "w-0",

      title: (data.title as string) || "New Tab",
      url: (data.url as string) || "",
      faviconURL: (data.faviconURL as string | null) ?? null,
      muted: (data.muted as boolean) || false,

      navHistory: (data.navHistory as NavigationEntry[]) || [],
      navHistoryIndex: (data.navHistoryIndex as number) || 0
    };
  } else {
    // Current version, no migration needed
    migrated = data as unknown as PersistedTabData;
  }

  // Clean up stale sleep entries from any version
  const cleaned = stripSleepEntries(migrated.navHistory, migrated.navHistoryIndex);
  migrated.navHistory = cleaned.navHistory;
  migrated.navHistoryIndex = cleaned.navHistoryIndex;

  // Fix url if it's the sleep URL (shouldn't have been persisted)
  if (migrated.url === SLEEP_MODE_URL) {
    // Use the entry at the adjusted navHistoryIndex, or fallback to empty
    const entry = migrated.navHistory[migrated.navHistoryIndex];
    migrated.url = entry?.url ?? "";
  }

  return migrated;
}
