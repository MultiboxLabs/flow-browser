import { Browser } from "@/browser/browser";
import { Tab } from "@/browser/tabs/tab";
import { browser } from "@/index";
import { getTabData } from "@/ipc/browser/tabs";
import { ArchiveTabValueMap } from "@/modules/basic-settings";
import { getDatastore } from "@/saving/datastore";
import { getSettingValueById } from "@/saving/settings";
import { app } from "electron";
import { TabData } from "~/types/tabs";

const TabsDataStore = getDatastore("tabs");
const TabGroupsDataStore = getDatastore("tabgroups");

// TODO: Persist tab groups?

export async function persistTabToStorage(tab: Tab) {
  const window = tab.getWindow();
  if (window.type !== "normal") return;

  const uniqueId = tab.uniqueId;
  const tabData = getTabData(tab);
  return await TabsDataStore.set(uniqueId, tabData)
    .then(() => true)
    .catch(() => false);
}

async function removeTabFromStorageById(uniqueId: string) {
  return await TabsDataStore.remove(uniqueId)
    .then(() => true)
    .catch(() => false);
}

export async function removeTabFromStorage(tab: Tab) {
  const uniqueId = tab.uniqueId;
  return await removeTabFromStorageById(uniqueId);
}

export async function removeTabDataFromStorage(tabData: TabData) {
  const uniqueId = tabData.uniqueId;
  return await removeTabFromStorageById(uniqueId);
}

export function shouldArchiveTab(lastActiveAt: number) {
  const archiveTabAfter = getSettingValueById("archiveTabAfter");
  const archiveTabAfterSeconds = ArchiveTabValueMap[archiveTabAfter as keyof typeof ArchiveTabValueMap];

  if (typeof archiveTabAfterSeconds !== "number") return false;

  const now = Math.floor(Date.now() / 1000);
  const diff = now - lastActiveAt;
  return diff > archiveTabAfterSeconds;
}

export async function loadTabsFromStorage() {
  const tabs: { [uniqueId: string]: TabData } = await TabsDataStore.getFullData();

  const filteredTabs = Object.entries(tabs)
    .map(([, tabData]) => {
      if (typeof tabData.lastActiveAt === "number") {
        const lastActiveAt = tabData.lastActiveAt;
        if (shouldArchiveTab(lastActiveAt)) {
          removeTabDataFromStorage(tabData);
          return null;
        }
      }
      return tabData;
    })
    .filter((tabData) => tabData !== null);

  return filteredTabs;
}

export async function wipeTabsFromStorage() {
  return await TabsDataStore.wipe();
}

async function createTabsFromTabDatas(browser: Browser, tabDatas: TabData[]) {
  // Group them by window id
  const windowTabs = tabDatas.reduce(
    (acc, tab) => {
      acc[tab.windowId] = [...(acc[tab.windowId] || []), tab];
      return acc;
    },
    {} as { [windowId: number]: TabData[] }
  );

  // Create a new window for each window id
  for (const [, tabs] of Object.entries(windowTabs)) {
    const window = await browser.createWindow("normal");

    for (const tabData of tabs) {
      browser.tabs.createTab(window.id, tabData.profileId, tabData.spaceId, undefined, {
        asleep: true,
        navHistory: tabData.navHistory,
        navHistoryIndex: tabData.navHistoryIndex,
        uniqueId: tabData.uniqueId,
        title: tabData.title,
        faviconURL: tabData.faviconURL || undefined
      });
    }
  }
}

export async function createInitialWindow() {
  if (!browser) return false;

  await app.whenReady();

  const tabs = await loadTabsFromStorage();
  if (tabs.length > 0) {
    await createTabsFromTabDatas(browser, tabs);
  } else {
    await browser.createWindow();
  }
  return true;
}
