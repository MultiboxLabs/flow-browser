import { useSpaces } from "@/components/providers/spaces-provider";
import { transformUrl } from "@/lib/url";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { TabData, TabGroupData, WindowTabsData } from "~/types/tabs";

export type TabGroup = Omit<TabGroupData, "tabIds"> & {
  tabs: TabData[];
  active: boolean;
  focusedTab: TabData | null;
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
  revalidate: () => Promise<void>;
  getActiveTabId: (spaceId: string) => number[] | null;
  getFocusedTabId: (spaceId: string) => number | null;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("useTabs must be used within a TabsProvider");
  }
  return context;
};

interface TabsProviderProps {
  children: React.ReactNode;
}

export const TabsProvider = ({ children }: TabsProviderProps) => {
  const { currentSpace } = useSpaces();
  const [tabsData, setTabsData] = useState<WindowTabsData | null>(null);

  const fetchTabs = useCallback(async () => {
    if (!flow) return;
    try {
      const data = await flow.tabs.getData();
      setTabsData(data);
    } catch (error) {
      console.error("Failed to fetch tabs data:", error);
    }
  }, []);

  const revalidate = useCallback(async () => {
    await fetchTabs();
  }, [fetchTabs]);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  useEffect(() => {
    if (!flow) return;
    const unsub = flow.tabs.onDataUpdated((data) => {
      setTabsData(data);
      // Potentially set isLoading to false here if needed,
      // depending on desired behavior for updates vs initial load.
      // setIsLoading(false);
    });
    return () => unsub();
  }, []); // Re-running this effect is not necessary as the callback handles updates

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

  const tabGroups = useMemo(() => {
    if (!tabsData) return [];

    const allTabGroupDatas: TabGroupData[] = [];
    const tabsWithGroups: number[] = [];

    const { tabGroups: groups = [] } = tabsData;
    for (const tabGroup of groups) {
      allTabGroupDatas.push(tabGroup);
      for (const tabId of tabGroup.tabIds) {
        tabsWithGroups.push(tabId);
      }
    }

    const tabsWithoutGroups = tabsData.tabs.filter((tab) => !tabsWithGroups.includes(tab.id));
    for (const tab of tabsWithoutGroups) {
      allTabGroupDatas.push({
        // to not conflict with tab group ids
        id: tab.id + 999,
        mode: "normal",
        profileId: tab.profileId,
        spaceId: tab.spaceId,
        tabIds: [tab.id],
        position: tab.position
      });
    }

    const tabGroups: TabGroup[] = [];
    allTabGroupDatas.map((tabGroupData) => {
      const activeTabIds = getActiveTabId(tabGroupData.spaceId);
      const isActive = tabGroupData.tabIds.some((tabId) => activeTabIds?.includes(tabId));

      const focusedTabId = getFocusedTabId(tabGroupData.spaceId);
      const focusedTab = tabsData?.tabs.find((tab) => tab.id === focusedTabId) || null;

      const tabGroup = {
        ...tabGroupData,
        tabs: tabsData?.tabs.filter((tab) => tabGroupData.tabIds.includes(tab.id)) || [],
        active: isActive,
        focusedTab
      };
      tabGroups.push(tabGroup);
    });

    return tabGroups;
  }, [getActiveTabId, getFocusedTabId, tabsData]);

  const getTabGroups = useCallback(
    (spaceId: string) => {
      return tabGroups.filter((tabGroup) => tabGroup.spaceId === spaceId);
    },
    [tabGroups]
  );

  const getActiveTabGroup = useCallback(
    (spaceId: string) => {
      const activeTabGroup = tabGroups.find((tabGroup) => {
        return tabGroup.spaceId === spaceId && tabGroup.active;
      });

      if (activeTabGroup) {
        return activeTabGroup;
      }

      return null;
    },
    [tabGroups]
  );

  const getFocusedTab = useCallback(
    (spaceId: string) => {
      const focusedTabGroup = tabGroups.find((tabGroup) => {
        return tabGroup.spaceId === spaceId && tabGroup.focusedTab;
      });

      if (focusedTabGroup) {
        return focusedTabGroup.focusedTab;
      }

      return null;
    },
    [tabGroups]
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

    const currentURL = focusedTab.url;

    const transformedUrl = transformUrl(currentURL);
    if (transformedUrl === null) {
      return currentURL;
    } else {
      if (transformedUrl) {
        return transformedUrl;
      } else {
        return "";
      }
    }
  }, [focusedTab]);

  return (
    <TabsContext.Provider
      value={{
        tabGroups,
        getTabGroups,
        getActiveTabGroup,
        getFocusedTab,

        // Current Space //
        activeTabGroup,
        focusedTab,
        addressUrl,
        // Utilities //
        tabsData,
        revalidate,
        getActiveTabId,
        getFocusedTabId
      }}
    >
      {children}
    </TabsContext.Provider>
  );
};
