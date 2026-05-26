import { tabService, tabPersistenceService } from "@/services/tab-service";
import { onSettingsCached, getSettingValueById } from "@/saving/settings";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { app } from "electron";
import type { BrowserWindowCreationOptions, BrowserWindowType } from "@/controllers/windows-controller/types/browser";
import type { PersistedTabData, PersistedTabLayoutNodeData } from "~/types/tab-service";
import { ArchiveTabValueMap } from "@/modules/basic-settings";

function shouldArchiveTab(lastActiveAt: number): boolean {
  const archiveAfter = getSettingValueById("archiveTabAfter");
  if (typeof archiveAfter !== "string" || archiveAfter === "never") return false;
  const archiveAfterSeconds = ArchiveTabValueMap[archiveAfter as keyof typeof ArchiveTabValueMap];
  if (typeof archiveAfterSeconds !== "number" || !isFinite(archiveAfterSeconds)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec - lastActiveAt >= archiveAfterSeconds;
}

/**
 * Loads tabs from storage, filters archived ones, and restores them into browser windows.
 */
export async function restoreSession(): Promise<boolean> {
  await app.whenReady();
  await onSettingsCached();

  const tabs = loadAndFilterTabs();
  if (tabs.length > 0) {
    await createTabsFromPersistedData(tabs);
  } else {
    await browserWindowsController.create();
  }

  return true;
}

function loadAndFilterTabs(): PersistedTabData[] {
  const allTabs = tabPersistenceService.loadAllTabs();

  const filtered: PersistedTabData[] = [];
  for (const tabData of allTabs) {
    if (typeof tabData.lastActiveAt === "number" && shouldArchiveTab(tabData.lastActiveAt)) {
      tabPersistenceService.removeTab(tabData.uniqueId);
      continue;
    }
    filtered.push(tabData);
  }

  return filtered;
}

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

  // Pre-load all required profiles before creating tabs
  const profileIds = new Set(tabDatas.map((t) => t.profileId));
  for (const profileId of profileIds) {
    await loadedProfilesController.load(profileId);
  }

  // Load persisted layout nodes and window states
  const persistedNodes = tabPersistenceService.loadAllLayoutNodes();
  const windowStates = tabPersistenceService.loadAllWindowStates();
  const uniqueIdToTabId = new Map<string, number>();

  // Create a window for each window group
  for (const [windowGroupId, tabs] of windowGroups) {
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

    tabService.beginBatch();
    try {
      for (const tabData of tabs) {
        // Skip tabs whose profile couldn't be loaded (e.g. deleted profile)
        if (!loadedProfilesController.get(tabData.profileId)) {
          tabPersistenceService.removeTab(tabData.uniqueId);
          continue;
        }

        const tab = tabService.createTabInternal(window.id, tabData.profileId, tabData.spaceId, undefined, {
          asleep: true,
          createdAt: tabData.createdAt,
          lastActiveAt: tabData.lastActiveAt,
          position: tabData.position,
          navHistory: tabData.navHistory,
          navHistoryIndex: tabData.navHistoryIndex,
          uniqueId: tabData.uniqueId,
          title: tabData.title,
          faviconURL: tabData.faviconURL || undefined
        });

        uniqueIdToTabId.set(tabData.uniqueId, tab.id);
      }
    } finally {
      tabService.endBatch();
    }
  }

  restoreLayoutNodes(persistedNodes, uniqueIdToTabId);
}

function restoreLayoutNodes(persistedNodes: PersistedTabLayoutNodeData[], uniqueIdToTabId: Map<string, number>): void {
  for (const nodeData of persistedNodes) {
    const tabIds: number[] = [];
    for (const uniqueId of nodeData.tabUniqueIds) {
      const tabId = uniqueIdToTabId.get(uniqueId);
      if (tabId !== undefined) {
        tabIds.push(tabId);
      }
    }

    if (tabIds.length < 2) {
      tabPersistenceService.removeLayoutNode(nodeData.id);
      continue;
    }

    // Get the window from the first tab
    const firstTab = tabService.getTabById(tabIds[0]);
    if (!firstTab) continue;

    tabService.createLayoutNode(firstTab.getWindow().id, nodeData.mode, tabIds);
  }
}
