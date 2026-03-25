import { GlanceTabGroup } from "@/controllers/tabs-controller/tab-groups/glance";
import { spacesController } from "@/controllers/spaces-controller";
import { recentlyClosedManager } from "./recently-closed-manager";
import type { BrowserWindow } from "@/controllers/windows-controller/types";
import { PersistedTabData, PersistedTabGroupData } from "~/types/tabs";
import { Tab } from "./tab";
import { tabsController } from ".";

/**
 * Attempts to restore a tab's group membership after it has been recreated.
 *
 * If the tab's original group still exists (other members survived), the tab
 * is added back to it. Otherwise, if other tabs from the same group are still
 * alive (but the group was destroyed), a new group is created with those tabs
 * plus the restored tab. If only the restored tab remains, it stays standalone.
 */
export function restoreTabGroupMembership(restoredTab: Tab, groupData?: PersistedTabGroupData): void {
  if (!groupData) return;

  const tabsByUniqueId = new Map<string, Tab>();
  for (const tab of tabsController.tabs.values()) {
    if (!tab.isDestroyed) {
      tabsByUniqueId.set(tab.uniqueId, tab);
    }
  }

  const otherTabIds: number[] = [];
  for (const uniqueId of groupData.tabUniqueIds) {
    if (uniqueId === restoredTab.uniqueId) continue;
    const tab = tabsByUniqueId.get(uniqueId);
    if (tab) {
      otherTabIds.push(tab.id);
    }
  }

  if (otherTabIds.length === 0) {
    return;
  }

  const existingGroup = tabsController.getTabGroupByTabId(otherTabIds[0]);
  if (existingGroup && existingGroup.mode === groupData.mode) {
    existingGroup.addTab(restoredTab.id);

    if (
      groupData.mode === "glance" &&
      groupData.glanceFrontTabUniqueId === restoredTab.uniqueId &&
      existingGroup instanceof GlanceTabGroup
    ) {
      existingGroup.setFrontTab(restoredTab.id);
    }
    return;
  }

  const allTabIds = [restoredTab.id, ...otherTabIds];
  if (allTabIds.length < 2) return;

  try {
    const newGroup = tabsController.createTabGroup(groupData.mode, allTabIds as [number, ...number[]]);

    if (groupData.mode === "glance" && groupData.glanceFrontTabUniqueId) {
      const frontTab = tabsByUniqueId.get(groupData.glanceFrontTabUniqueId);
      if (frontTab && newGroup instanceof GlanceTabGroup) {
        newGroup.setFrontTab(frontTab.id);
      }
    }
  } catch (error) {
    console.error("Failed to restore tab group membership:", error);
  }
}

async function restoreIntoWindow(
  window: BrowserWindow,
  result: { tabData: PersistedTabData; tabGroupData?: PersistedTabGroupData }
): Promise<boolean> {
  const { tabData, tabGroupData } = result;
  const space = await spacesController.get(tabData.spaceId);
  if (!space) return false;

  const restoredTab = await tabsController.createTab(window.id, space.profileId, tabData.spaceId, undefined, {
    uniqueId: tabData.uniqueId,
    window,
    position: tabData.position,
    title: tabData.title,
    faviconURL: tabData.faviconURL ?? undefined,
    navHistory: tabData.navHistory,
    navHistoryIndex: tabData.navHistoryIndex
  });

  restoreTabGroupMembership(restoredTab, tabGroupData);
  tabsController.setActiveTab(restoredTab);
  return true;
}

export async function restoreRecentlyClosedTabInWindow(window: BrowserWindow, uniqueId: string): Promise<boolean> {
  const result = recentlyClosedManager.restore(uniqueId);
  if (!result) return false;
  return restoreIntoWindow(window, result);
}

export async function restoreMostRecentClosedTabInWindow(window: BrowserWindow): Promise<boolean> {
  const result = recentlyClosedManager.restoreMostRecent();
  if (!result) return false;
  return restoreIntoWindow(window, result);
}
