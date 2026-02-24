import { PersistedTabData, PersistedTabGroupData, PersistedWindowState } from "~/types/tabs";
import { tabPersistenceManager } from "@/saving/tabs";
import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { shouldArchiveTab } from "@/saving/tabs";
import { app } from "electron";
import { GlanceTabGroup } from "@/controllers/tabs-controller/tab-groups/glance";
import type { BrowserWindowCreationOptions, BrowserWindowType } from "@/controllers/windows-controller/types/browser";

/**
 * Loads tabs and tab groups from storage, filters archived ones,
 * and restores them into browser windows.
 */
export async function restoreSession(): Promise<boolean> {
  await app.whenReady();

  const tabs = await loadAndFilterTabs();
  if (tabs.length > 0) {
    await createTabsFromPersistedData(tabs);
  } else {
    await browserWindowsController.create();
  }

  return true;
}

/**
 * Loads tabs from storage and filters out archived ones.
 */
async function loadAndFilterTabs(): Promise<PersistedTabData[]> {
  const allTabs = await tabPersistenceManager.loadAllTabs();

  const filtered: PersistedTabData[] = [];
  for (const tabData of allTabs) {
    if (typeof tabData.lastActiveAt === "number" && shouldArchiveTab(tabData.lastActiveAt)) {
      // Remove archived tab from storage
      await tabPersistenceManager.removeTab(tabData.uniqueId);
      continue;
    }
    filtered.push(tabData);
  }

  return filtered;
}

/**
 * Creates browser windows and tabs from persisted data.
 * Groups tabs by windowGroupId to recreate window layout.
 * Also restores tab groups.
 */
async function createTabsFromPersistedData(tabDatas: PersistedTabData[]): Promise<void> {
  // Group tabs by windowGroupId
  const windowGroups = new Map<string, PersistedTabData[]>();
  for (const tabData of tabDatas) {
    const groupId = tabData.windowGroupId;
    if (!windowGroups.has(groupId)) {
      windowGroups.set(groupId, []);
    }
    windowGroups.get(groupId)!.push(tabData);
  }

  // Load persisted tab groups and window states
  const persistedGroups = await tabPersistenceManager.loadAllTabGroups();
  const windowStates = await tabPersistenceManager.loadAllWindowStates();

  // Create a window for each window group
  for (const [windowGroupId, tabs] of windowGroups) {
    // Read window state from the dedicated window state store
    const windowState = windowStates.get(windowGroupId);

    // Fall back to legacy per-tab window fields for backward compatibility
    const firstTab = tabs[0];
    const legacyState: PersistedWindowState | undefined =
      firstTab.windowWidth || firstTab.windowHeight
        ? {
            width: firstTab.windowWidth ?? 1280,
            height: firstTab.windowHeight ?? 720,
            x: firstTab.windowX ?? 0,
            y: firstTab.windowY ?? 0,
            isPopup: firstTab.windowIsPopup
          }
        : undefined;

    const state = windowState ?? legacyState;

    const windowType: BrowserWindowType = state?.isPopup ? "popup" : "normal";
    const windowOptions: BrowserWindowCreationOptions = {};
    if (state) {
      windowOptions.width = state.width;
      windowOptions.height = state.height;
      if (state.x !== undefined) windowOptions.x = state.x;
      if (state.y !== undefined) windowOptions.y = state.y;
    }
    const window = await browserWindowsController.create(windowType, windowOptions);

    // Track uniqueId -> runtime tab id mapping for tab group restoration
    const uniqueIdToTabId = new Map<string, number>();

    for (const tabData of tabs) {
      const tab = await tabsController.createTab(window.id, tabData.profileId, tabData.spaceId, undefined, {
        asleep: true,
        position: tabData.position,
        navHistory: tabData.navHistory,
        navHistoryIndex: tabData.navHistoryIndex,
        uniqueId: tabData.uniqueId,
        title: tabData.title,
        faviconURL: tabData.faviconURL || undefined
      });

      uniqueIdToTabId.set(tabData.uniqueId, tab.id);
    }

    // Restore tab groups for this window
    restoreTabGroups(persistedGroups, uniqueIdToTabId);
  }
}

/**
 * Restores tab groups from persisted data using the uniqueId -> tabId mapping.
 */
function restoreTabGroups(persistedGroups: PersistedTabGroupData[], uniqueIdToTabId: Map<string, number>): void {
  for (const groupData of persistedGroups) {
    // Resolve uniqueIds to runtime tab IDs
    const tabIds: number[] = [];
    for (const uniqueId of groupData.tabUniqueIds) {
      const tabId = uniqueIdToTabId.get(uniqueId);
      if (tabId !== undefined) {
        tabIds.push(tabId);
      }
    }

    if (tabIds.length < 2) {
      // Tab groups need at least 2 tabs
      continue;
    }

    try {
      const group = tabsController.createTabGroup(groupData.mode, tabIds as [number, ...number[]]);

      // Restore glance front tab
      if (groupData.mode === "glance" && groupData.glanceFrontTabUniqueId) {
        const frontTabId = uniqueIdToTabId.get(groupData.glanceFrontTabUniqueId);
        if (frontTabId !== undefined && group instanceof GlanceTabGroup) {
          group.setFrontTab(frontTabId);
        }
      }
    } catch (error) {
      console.error("Failed to restore tab group:", error);
    }
  }
}
