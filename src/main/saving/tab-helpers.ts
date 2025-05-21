import { Browser } from "../browser/browser";
import { Tab } from "../browser/tabs/tab";
import { TabFolderData, TabGroupData } from "../../shared/types/tabs";

/**
 * Creates tab groups from tab group data
 */
export async function createTabGroupsFromTabGroupDatas(browser: Browser, tabGroupDatas: TabGroupData[]) {
  const sortedTabGroupDatas = [...tabGroupDatas].sort((a, b) => a.position - b.position);

  for (const tabGroupData of sortedTabGroupDatas) {
    if (tabGroupData.tabIds.length === 0) continue;

    const tabs = tabGroupData.tabIds.map((id) => browser.tabs.getTabById(id)).filter(Boolean) as Tab[];
    if (tabs.length === 0) continue;

    const tabGroup = browser.tabs.createTabGroup(tabGroupData.mode, [tabs[0].id, ...tabs.slice(1).map((t) => t.id)] as [
      number,
      ...number[]
    ]);

    tabGroup.setPosition(tabGroupData.position);

    if (tabGroupData.mode === "glance" && tabGroupData.glanceFrontTabId) {
      (tabGroup as any).setFrontTab(tabGroupData.glanceFrontTabId);
    }
  }
}

/**
 * Creates tab folders from tab folder data
 */
export async function createTabFoldersFromTabFolderDatas(browser: Browser, tabFolderDatas: TabFolderData[]) {
  const sortedTabFolderDatas = [...tabFolderDatas].sort((a, b) => a.position - b.position);

  for (const tabFolderData of sortedTabFolderDatas) {
    if (tabFolderData.tabGroupIds.length === 0) continue;

    const folder = browser.tabs.createTabFolder(
      tabFolderData.name,
      tabFolderData.profileId,
      tabFolderData.spaceId,
      tabFolderData.position
    );

    for (const tabGroupId of tabFolderData.tabGroupIds) {
      folder.addTabGroup(tabGroupId);

      const tabGroup = browser.tabs.getTabGroupById(tabGroupId);
      if (tabGroup) {
        tabGroup.setFolder(folder.id);
      }
    }

    folder.setExpanded(tabFolderData.expanded);
  }
}
