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

    // Directly use tabGroups from the main process. No synthesis needed.
    const allTabGroupDatas: TabGroupData[] = tabsData.tabGroups || [];
    const allTabs: TabData[] = tabsData.tabs || [];

    const processedTabGroups: TabGroup[] = allTabGroupDatas.map((groupData) => {
      // Filter tabs from allTabs that belong to the current groupData.id
      const tabsInThisGroup = allTabs.filter((tab) => tab.groupId === groupData.id);

      const activeTabIdsInSpace = getActiveTabId(groupData.spaceId) || [];
      // A group is active if any of its tabs are among the active tabs in that space.
      const isActive = tabsInThisGroup.some((tab) => activeTabIdsInSpace.includes(tab.id));

      const focusedTabIdInSpace = getFocusedTabId(groupData.spaceId);
      let groupFocusedTab: TabData | null = null;
      if (focusedTabIdInSpace !== null) {
        const potentialFocusedTab = allTabs.find((tab) => tab.id === focusedTabIdInSpace);
        // Ensure the focused tab actually belongs to this group
        if (potentialFocusedTab && potentialFocusedTab.groupId === groupData.id) {
          groupFocusedTab = potentialFocusedTab;
        }
      }

      return {
        ...groupData, // Spread properties from TabGroupData (id, mode, profileId, spaceId)
                       // Note: tabIds from TabGroupData is now less relevant for client-side rendering of tabs,
                       // as TabData.groupId is the source of truth for belonging.
                       // We keep it if other parts of the app use it, but `tabs` array below is primary.
        tabs: tabsInThisGroup,
        active: isActive,
        focusedTab: groupFocusedTab
      };
    });

    return processedTabGroups;
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
