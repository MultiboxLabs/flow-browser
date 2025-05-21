import { Browser } from "@/browser/browser";
import { SLEEP_MODE_URL, Tab } from "@/browser/tabs/tab";
import { browser } from "@/index";
import { getTabData } from "@/ipc/browser/tabs";
import { ArchiveTabValueMap, SleepTabValueMap } from "@/modules/basic-settings";
import { getDatastore } from "@/saving/datastore";
import { getSettingValueById } from "@/saving/settings";
import { createTabGroupsFromTabGroupDatas, createTabFoldersFromTabFolderDatas } from "./tab-helpers";
import { app } from "electron";
import { TabData, TabGroupData, TabFolderData } from "~/types/tabs";

const TabsDataStore = getDatastore("tabs");
const TabGroupsDataStore = getDatastore("tabgroups");
const TabFoldersDataStore = getDatastore("tabfolders");

export function getTabDatastore() {
  return TabsDataStore;
}

export function getTabGroupDatastore() {
  return TabGroupsDataStore;
}

export function getTabFolderDatastore() {
  return TabFoldersDataStore;
}

export async function persistTabToStorage(tab: Tab) {
  const window = tab.getWindow();
  if (window.type !== "normal") return;

  // Prevent saving tabs stuck in sleep mode
  // if (tab.url === SLEEP_MODE_URL) return;
  // if (tab.asleep) return;
  // if (tab.navHistory.length === 0) return;

  const uniqueId = tab.uniqueId;
  const tabData = getTabData(tab);

  // Do NOT save sleep tabs
  const asleep = tab.asleep;
  const saveURL = !asleep && tab.url !== SLEEP_MODE_URL;
  const saveNavHistory = !asleep && !tab.navHistory.find((entry) => entry.url === SLEEP_MODE_URL);

  const recoverFromOldData = !saveURL || !saveNavHistory;

  // Transform the tab data
  const transformedTabData = {
    ...tabData
  };

  if (recoverFromOldData) {
    const oldTabData = await TabsDataStore.get<TabData>(uniqueId);
    if (!oldTabData) return;

    const oldTabDataUrl = oldTabData?.url;
    if (!saveURL) {
      if (!oldTabDataUrl) return;
      transformedTabData.url = oldTabDataUrl;
    }

    const oldTabDataNavHistory = oldTabData?.navHistory;
    if (!saveNavHistory) {
      if (!oldTabDataNavHistory) return;
      transformedTabData.navHistory = oldTabDataNavHistory;
    }
  }

  // Save the tab data
  console.log("saving tab", tabData.id, tabData.position);
  return await TabsDataStore.set(uniqueId, transformedTabData)
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

export function shouldSleepTab(lastActiveAt: number) {
  const sleepTabAfter = getSettingValueById("sleepTabAfter");
  const sleepTabAfterSeconds = SleepTabValueMap[sleepTabAfter as keyof typeof SleepTabValueMap];

  if (typeof sleepTabAfterSeconds !== "number") return false;

  const now = Math.floor(Date.now() / 1000);
  const diff = now - lastActiveAt;
  return diff > sleepTabAfterSeconds;
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
    .filter((tabData) => tabData !== null) as TabData[];

  return filteredTabs;
}

/**
 * Loads tab groups from storage
 */
export async function loadTabGroupsFromStorage() {
  const tabGroups: { [id: string]: TabGroupData } = await TabGroupsDataStore.getFullData();

  return Object.values(tabGroups);
}

/**
 * Loads tab folders from storage
 */
export async function loadTabFoldersFromStorage() {
  const tabFolders: { [id: string]: TabFolderData } = await TabFoldersDataStore.getFullData();

  return Object.values(tabFolders);
}

export async function wipeTabsFromStorage() {
  await TabsDataStore.wipe();
  await TabGroupsDataStore.wipe();
  await TabFoldersDataStore.wipe();
  return true;
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
        position: tabData.position,
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
  const tabGroups = await loadTabGroupsFromStorage();
  const tabFolders = await loadTabFoldersFromStorage();

  if (tabs.length > 0) {
    // Create tabs first
    await createTabsFromTabDatas(browser, tabs);

    if (tabGroups.length > 0) {
      await createTabGroupsFromTabGroupDatas(browser, tabGroups);
    }

    if (tabFolders.length > 0) {
      await createTabFoldersFromTabFolderDatas(browser, tabFolders);
    }
  } else {
    await browser.createWindow();
  }
  return true;
}
