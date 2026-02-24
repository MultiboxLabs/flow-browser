import { PersistedTabData, PersistedTabGroupData } from "~/types/tabs";
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
  const uniqueIdToTabId = new Map<string, number>();

  // Create a window for each window group
  for (const [windowGroupId, tabs] of windowGroups) {
    // Read window state from the dedicated window state store
    const windowState = windowStates.get(windowGroupId);

    const windowType: BrowserWindowType = windowState?.isPopup ? "popup" : "normal";
    const windowOptions: BrowserWindowCreationOptions = {};
    if (windowState) {
      windowOptions.width = windowState.width;
      windowOptions.height = windowState.height;
      if (windowState.x !== undefined) windowOptions.x = windowState.x;
      if (windowState.y !== undefined) windowOptions.y = windowState.y;
    }
    const window = await browserWindowsController.create(windowType, windowOptions);

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
  }

  await restoreTabGroups(persistedGroups, uniqueIdToTabId);
}

/**
 * Restores tab groups from persisted data using the uniqueId -> tabId mapping.
 */
async function restoreTabGroups(
  persistedGroups: PersistedTabGroupData[],
  uniqueIdToTabId: Map<string, number>
): Promise<void> {
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
      try {
        await tabPersistenceManager.removeTabGroup(groupData.groupId);
      } catch (error) {
        console.error("Failed to remove stale tab group:", error);
      }
      continue;
    }

    try {
      const group = tabsController.createTabGroup(groupData.mode, tabIds as [number, ...number[]], groupData.groupId);

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
