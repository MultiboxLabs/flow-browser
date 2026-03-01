import { useSpaces } from "@/components/providers/spaces-provider";
import { transformUrl } from "@/lib/url";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { TabData, TabGroupData, WindowTabsData } from "~/types/tabs";

export type TabGroup = Omit<TabGroupData, "tabIds"> & {
  tabs: TabData[];
  active: boolean;
  focusedTab: TabData | null;
};

type TabGroupCacheEntry = {
  source: TabGroupData;
  tabs: TabData[];
  active: boolean;
  focusedTab: TabData | null;
  value: TabGroup;
};

interface TabsContextValue {
  tabGroups: TabGroup[];
  getTabGroups: (spaceId: string) => TabGroup[];
  getActiveTabGroup: (spaceId: string) => TabGroup | null;
  getFocusedTab: (spaceId: string) => TabData | null;

  // Current Space //
  activeTabGroup: TabGroup | null;
  focusedTab: TabData | null;
  addressUrl: string;

  // Utilities //
  tabsData: WindowTabsData | null;
  getActiveTabId: (spaceId: string) => number[] | null;
  getFocusedTabId: (spaceId: string) => number | null;
}

const TabsContext = createContext<TabsContextValue | null>(null);
const TabsGroupsContext = createContext<Pick<
  TabsContextValue,
  "tabGroups" | "getTabGroups" | "getActiveTabGroup" | "getFocusedTab" | "activeTabGroup"
> | null>(null);
const TabsFocusedContext = createContext<Pick<TabsContextValue, "focusedTab" | "addressUrl"> | null>(null);
const TabsFocusedIdContext = createContext<number | null | undefined>(undefined);
const TabsFocusedLoadingContext = createContext<boolean | undefined>(undefined);
const TabsFocusedFullscreenContext = createContext<boolean | undefined>(undefined);

export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("useTabs must be used within a TabsProvider");
  }
  return context;
};

export const useTabsGroups = () => {
  const context = useContext(TabsGroupsContext);
  if (!context) {
    throw new Error("useTabsGroups must be used within a TabsProvider");
  }
  return context;
};

export const useFocusedTab = () => {
  const context = useContext(TabsFocusedContext);
  if (!context) {
    throw new Error("useFocusedTab must be used within a TabsProvider");
  }
  return context.focusedTab;
};

export const useAddressUrl = () => {
  const context = useContext(TabsFocusedContext);
  if (!context) {
    throw new Error("useAddressUrl must be used within a TabsProvider");
  }
  return context.addressUrl;
};

export const useFocusedTabId = () => {
  const context = useContext(TabsFocusedIdContext);
  if (context === undefined) {
    throw new Error("useFocusedTabId must be used within a TabsProvider");
  }
  return context;
};

export const useFocusedTabLoading = () => {
  const context = useContext(TabsFocusedLoadingContext);
  if (context === undefined) {
    throw new Error("useFocusedTabLoading must be used within a TabsProvider");
  }
  return context;
};

export const useFocusedTabFullscreen = () => {
  const context = useContext(TabsFocusedFullscreenContext);
  if (context === undefined) {
    throw new Error("useFocusedTabFullscreen must be used within a TabsProvider");
  }
  return context;
};

interface TabsProviderProps {
  children: React.ReactNode;
}

const EMPTY_TAB_GROUPS: TabGroup[] = [];
const EMPTY_TAB_GROUP_CACHE = new Map<string, TabGroupCacheEntry>();

function areSameTabRefs(a: TabData[], b: TabData[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const TabsProvider = ({ children }: TabsProviderProps) => {
  const { currentSpace } = useSpaces();
  const [tabsData, setTabsData] = useState<WindowTabsData | null>(null);
  const tabGroupCacheRef = useRef<Map<string, TabGroupCacheEntry>>(EMPTY_TAB_GROUP_CACHE);

  const fetchTabs = useCallback(async () => {
    if (!flow) return;
    try {
      const data = await flow.tabs.getData();
      setTabsData(data);
    } catch (error) {
      console.error("Failed to fetch tabs data:", error);
    }
  }, []);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  useEffect(() => {
    if (!flow) return;

    // Full data refresh (structural changes: tab created/removed, active tab changed)
    const unsubFull = flow.tabs.onDataUpdated((data) => {
      setTabsData(data);
    });

    // Lightweight content update (title, url, isLoading, etc.)
    // Merges changed tabs into existing state without replacing the full object.
    const unsubContent = flow.tabs.onTabsContentUpdated((updatedTabs) => {
      setTabsData((prev) => {
        if (!prev) return prev;
        if (updatedTabs.length === 0) return prev;

        // Build lookup for fast matching
        const updatesById = new Map(updatedTabs.map((t) => [t.id, t]));

        // Replace only changed tabs and keep untouched entries by reference.
        let anyChanged = false;
        const newTabs = prev.tabs.map((tab) => {
          const updated = updatesById.get(tab.id);
          if (updated) {
            anyChanged = true;
            return updated;
          }
          return tab;
        });

        if (!anyChanged) return prev;
        return { ...prev, tabs: newTabs };
      });
    });

    return () => {
      unsubFull();
      unsubContent();
    };
  }, []);

  const getActiveTabId = useCallback(
    (spaceId: string) => {
      return tabsData?.activeTabIds[spaceId] || null;
    },
    [tabsData]
  );

  const getFocusedTabId = useCallback(
    (spaceId: string) => {
      return tabsData?.focusedTabIds[spaceId] || null;
    },
    [tabsData]
  );

  const { tabGroups, tabGroupsBySpaceId, activeTabGroupBySpaceId, focusedTabBySpaceId, nextTabGroupCache } =
    useMemo(() => {
      const tabGroupsBySpaceId = new Map<string, TabGroup[]>();
      const activeTabGroupBySpaceId = new Map<string, TabGroup | null>();
      const focusedTabBySpaceId = new Map<string, TabData | null>();
      const nextTabGroupCache = new Map<string, TabGroupCacheEntry>();
      const previousTabGroupCache = tabGroupCacheRef.current;

      if (!tabsData) {
        return {
          tabGroups: EMPTY_TAB_GROUPS,
          tabGroupsBySpaceId,
          activeTabGroupBySpaceId,
          focusedTabBySpaceId,
          nextTabGroupCache
        };
      }

      const tabById = new Map<number, TabData>();
      for (const tab of tabsData.tabs) {
        tabById.set(tab.id, tab);
      }

      const allTabGroupDatas: TabGroupData[] = [];
      const tabsWithGroups = new Set<number>();
      for (const tabGroup of tabsData.tabGroups ?? []) {
        allTabGroupDatas.push(tabGroup);
        for (const tabId of tabGroup.tabIds) {
          tabsWithGroups.add(tabId);
        }
      }

      for (const tab of tabsData.tabs) {
        if (tabsWithGroups.has(tab.id)) continue;
        // Ephemeral tabs (e.g. pinned-tab-associated) are included in tabById
        // for focusedTab resolution but should not appear in the sidebar tab list.
        if (tab.ephemeral) continue;
        allTabGroupDatas.push({
          // Synthetic group ID — uses string format to avoid collision with real group IDs
          id: `s-${tab.uniqueId}`,
          mode: "normal",
          profileId: tab.profileId,
          spaceId: tab.spaceId,
          tabIds: [tab.id],
          position: tab.position
        });
      }

      const activeTabIdsBySpaceId = new Map<string, Set<number>>();
      for (const [spaceId, activeTabIds] of Object.entries(tabsData.activeTabIds)) {
        activeTabIdsBySpaceId.set(spaceId, new Set(activeTabIds));
      }

      for (const [spaceId, focusedTabId] of Object.entries(tabsData.focusedTabIds)) {
        focusedTabBySpaceId.set(spaceId, tabById.get(focusedTabId) ?? null);
      }

      const tabGroups: TabGroup[] = [];

      for (const tabGroupData of allTabGroupDatas) {
        const tabs: TabData[] = [];
        for (const tabId of tabGroupData.tabIds) {
          const tab = tabById.get(tabId);
          if (tab) {
            tabs.push(tab);
          }
        }

        if (tabs.length === 0) continue;

        const activeTabIds = activeTabIdsBySpaceId.get(tabGroupData.spaceId);
        const isActive = tabs.some((tab) => activeTabIds?.has(tab.id));
        const focusedTab = focusedTabBySpaceId.get(tabGroupData.spaceId) ?? null;

        const tabGroupKey = `${tabGroupData.spaceId}:${tabGroupData.id}`;
        const previousEntry = previousTabGroupCache.get(tabGroupKey);

        let tabGroup: TabGroup;
        if (
          previousEntry &&
          previousEntry.source === tabGroupData &&
          previousEntry.active === isActive &&
          previousEntry.focusedTab === focusedTab &&
          areSameTabRefs(previousEntry.tabs, tabs)
        ) {
          tabGroup = previousEntry.value;
        } else {
          tabGroup = {
            ...tabGroupData,
            tabs,
            active: isActive,
            focusedTab
          };
        }

        nextTabGroupCache.set(tabGroupKey, {
          source: tabGroupData,
          tabs,
          active: isActive,
          focusedTab,
          value: tabGroup
        });
        tabGroups.push(tabGroup);

        const existingGroups = tabGroupsBySpaceId.get(tabGroupData.spaceId);
        if (existingGroups) {
          existingGroups.push(tabGroup);
        } else {
          tabGroupsBySpaceId.set(tabGroupData.spaceId, [tabGroup]);
        }

        if (isActive && !activeTabGroupBySpaceId.has(tabGroupData.spaceId)) {
          activeTabGroupBySpaceId.set(tabGroupData.spaceId, tabGroup);
        }
      }

      for (const [spaceId, spaceTabGroups] of tabGroupsBySpaceId) {
        spaceTabGroups.sort((a, b) => a.position - b.position);
        if (!activeTabGroupBySpaceId.has(spaceId)) {
          activeTabGroupBySpaceId.set(spaceId, null);
        }
        if (!focusedTabBySpaceId.has(spaceId)) {
          focusedTabBySpaceId.set(spaceId, null);
        }
      }

      return {
        tabGroups,
        tabGroupsBySpaceId,
        activeTabGroupBySpaceId,
        focusedTabBySpaceId,
        nextTabGroupCache
      };
    }, [tabsData]);

  useEffect(() => {
    tabGroupCacheRef.current = nextTabGroupCache;
  }, [nextTabGroupCache]);

  const getTabGroups = useCallback(
    (spaceId: string) => {
      return tabGroupsBySpaceId.get(spaceId) ?? EMPTY_TAB_GROUPS;
    },
    [tabGroupsBySpaceId]
  );

  const getActiveTabGroup = useCallback(
    (spaceId: string) => {
      return activeTabGroupBySpaceId.get(spaceId) ?? null;
    },
    [activeTabGroupBySpaceId]
  );

  const getFocusedTab = useCallback(
    (spaceId: string) => {
      return focusedTabBySpaceId.get(spaceId) ?? null;
    },
    [focusedTabBySpaceId]
  );

  const activeTabGroup = useMemo(() => {
    if (!currentSpace) return null;
    return getActiveTabGroup(currentSpace.id);
  }, [getActiveTabGroup, currentSpace]);

  const focusedTab = useMemo(() => {
    if (!currentSpace) return null;
    return getFocusedTab(currentSpace.id);
  }, [getFocusedTab, currentSpace]);

  const addressUrl = useMemo(() => {
    if (!focusedTab) return "";

    const transformedUrl = transformUrl(focusedTab.url);
    if (transformedUrl === null) {
      return focusedTab.url;
    } else {
      if (transformedUrl) {
        return transformedUrl;
      } else {
        return "";
      }
    }
  }, [focusedTab]);

  const groupsContextValue = useMemo(
    () => ({
      tabGroups,
      getTabGroups,
      getActiveTabGroup,
      getFocusedTab,
      activeTabGroup
    }),
    [tabGroups, getTabGroups, getActiveTabGroup, getFocusedTab, activeTabGroup]
  );

  const focusedContextValue = useMemo(
    () => ({
      focusedTab,
      addressUrl
    }),
    [focusedTab, addressUrl]
  );
  // Use the raw numeric ID from the main process rather than deriving it
  // from the resolved TabData object. The focused tab may be ephemeral
  // (e.g. a pinned tab's associated tab) and therefore absent from
  // tabsData.tabs / tabById — but its numeric ID is still valid and
  // needed by the pin grid to detect active state.
  const focusedTabId = (currentSpace && tabsData?.focusedTabIds[currentSpace.id]) ?? null;
  const isFocusedTabLoading = focusedTab?.isLoading ?? false;
  const isFocusedTabFullscreen = focusedTab?.fullScreen ?? false;

  const contextValue = useMemo(
    () => ({
      ...groupsContextValue,
      ...focusedContextValue,
      // Utilities //
      tabsData,
      getActiveTabId,
      getFocusedTabId
    }),
    [groupsContextValue, focusedContextValue, tabsData, getActiveTabId, getFocusedTabId]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <TabsGroupsContext.Provider value={groupsContextValue}>
        <TabsFocusedContext.Provider value={focusedContextValue}>
          <TabsFocusedIdContext.Provider value={focusedTabId}>
            <TabsFocusedLoadingContext.Provider value={isFocusedTabLoading}>
              <TabsFocusedFullscreenContext.Provider value={isFocusedTabFullscreen}>
                {children}
              </TabsFocusedFullscreenContext.Provider>
            </TabsFocusedLoadingContext.Provider>
          </TabsFocusedIdContext.Provider>
        </TabsFocusedContext.Provider>
      </TabsGroupsContext.Provider>
    </TabsContext.Provider>
  );
};
