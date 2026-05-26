import { useSpaces } from "@/components/providers/spaces-provider";
import { transformUrlToDisplayURL } from "@/lib/url";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { TabData, TabLayoutNodeData, WindowTabsPayload } from "~/types/tab-service";

/** Enriched layout node for sidebar rendering (tabs resolved from payload). */
export type TabLayoutNodeView = {
  id: string;
  mode: string;
  profileId: string;
  spaceId: string;
  position: number;
  tabIds: number[];
  frontTabId?: number;
  tabs: TabData[];
  active: boolean;
  focusedTab: TabData | null;
};

type TabLayoutNodeCacheEntry = {
  source: TabLayoutNodeData | null;
  tabs: TabData[];
  active: boolean;
  focusedTab: TabData | null;
  value: TabLayoutNodeView;
};

interface TabsContextValue {
  layoutNodes: TabLayoutNodeView[];
  getLayoutNodes: (spaceId: string) => TabLayoutNodeView[];
  getActiveLayoutNode: (spaceId: string) => TabLayoutNodeView | null;
  getFocusedTab: (spaceId: string) => TabData | null;

  // Current Space //
  activeLayoutNode: TabLayoutNodeView | null;
  focusedTab: TabData | null;
  addressUrl: string;

  // Utilities //
  tabsData: WindowTabsPayload | null;
  getActiveTabId: (spaceId: string) => number[] | null;
  getFocusedTabId: (spaceId: string) => number | null;
}

const TabsContext = createContext<TabsContextValue | null>(null);
const TabsLayoutNodesContext = createContext<Pick<
  TabsContextValue,
  "layoutNodes" | "getLayoutNodes" | "getActiveLayoutNode" | "getFocusedTab" | "activeLayoutNode"
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

export const useTabLayoutNodes = () => {
  const context = useContext(TabsLayoutNodesContext);
  if (!context) {
    throw new Error("useTabLayoutNodes must be used within a TabsProvider");
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

const EMPTY_LAYOUT_NODES: TabLayoutNodeView[] = [];
const EMPTY_LAYOUT_NODE_CACHE = new Map<string, TabLayoutNodeCacheEntry>();

function areSameTabRefs(a: TabData[], b: TabData[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const TabsProvider = ({ children }: TabsProviderProps) => {
  const { currentSpace } = useSpaces();
  const [tabsData, setTabsData] = useState<WindowTabsPayload | null>(null);
  const layoutNodeCacheRef = useRef<Map<string, TabLayoutNodeCacheEntry>>(EMPTY_LAYOUT_NODE_CACHE);

  const fetchTabs = useCallback(async () => {
    if (!flow) return;
    try {
      const data = await flow.tabService.getData();
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
    const unsubFull = flow.tabService.onDataUpdated((data) => {
      setTabsData(data);
    });

    // Lightweight content update (title, url, isLoading, etc.)
    // Merges changed tabs into existing state without replacing the full object.
    const unsubContent = flow.tabService.onContentUpdated((updatedTabs) => {
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
      if (!tabsData) return null;
      // Resolve from active layout node
      const activeNodeId = tabsData.activeLayoutNodeIds[spaceId];
      if (!activeNodeId) return null;
      // Find the node to get its tab IDs
      const node = tabsData.layoutNodes.find((n) => n.id === activeNodeId);
      if (node) return node.tabIds;
      // Single nodes are not serialized in layoutNodes. Main still sends their
      // real ln-* node IDs, so resolve active single tabs via the focused tab.
      const focusedTabId = tabsData.focusedTabIds[spaceId];
      if (focusedTabId !== undefined) return [focusedTabId];
      return null;
    },
    [tabsData]
  );

  const getFocusedTabId = useCallback(
    (spaceId: string) => {
      return tabsData?.focusedTabIds[spaceId] || null;
    },
    [tabsData]
  );

  const { layoutNodes, layoutNodesBySpaceId, activeLayoutNodeBySpaceId, focusedTabBySpaceId, nextLayoutNodeCache } =
    useMemo(() => {
      const layoutNodesBySpaceId = new Map<string, TabLayoutNodeView[]>();
      const activeLayoutNodeBySpaceId = new Map<string, TabLayoutNodeView | null>();
      const focusedTabBySpaceId = new Map<string, TabData | null>();
      const nextLayoutNodeCache = new Map<string, TabLayoutNodeCacheEntry>();
      const previousLayoutNodeCache = layoutNodeCacheRef.current;

      if (!tabsData) {
        return {
          layoutNodes: EMPTY_LAYOUT_NODES,
          layoutNodesBySpaceId,
          activeLayoutNodeBySpaceId,
          focusedTabBySpaceId,
          nextLayoutNodeCache
        };
      }

      const tabById = new Map<number, TabData>();
      for (const tab of tabsData.tabs) {
        tabById.set(tab.id, tab);
      }

      // Build active node IDs set per space
      const activeNodeBySpace = new Map<string, string>();
      for (const [spaceId, nodeId] of Object.entries(tabsData.activeLayoutNodeIds)) {
        activeNodeBySpace.set(spaceId, nodeId);
      }
      const serializedLayoutNodeIds = new Set(tabsData.layoutNodes.map((node) => node.id));

      for (const [spaceId, focusedTabId] of Object.entries(tabsData.focusedTabIds)) {
        focusedTabBySpaceId.set(spaceId, tabById.get(focusedTabId) ?? null);
      }

      // Collect tabs that are part of multi-tab layout nodes
      const tabsInNodes = new Set<number>();
      for (const node of tabsData.layoutNodes) {
        for (const tabId of node.tabIds) {
          tabsInNodes.add(tabId);
        }
      }

      // Build views from layout nodes (multi-tab: glance/split)
      interface InternalLayoutNodeData {
        id: string;
        mode: string;
        profileId: string;
        spaceId: string;
        tabIds: number[];
        frontTabId?: number;
        position: number;
        nodeData: TabLayoutNodeData | null;
      }

      const allLayoutNodeDatas: InternalLayoutNodeData[] = [];

      for (const node of tabsData.layoutNodes) {
        allLayoutNodeDatas.push({
          id: node.id,
          mode: node.mode,
          profileId: node.profileId,
          spaceId: node.spaceId,
          tabIds: node.tabIds,
          frontTabId: node.frontTabId,
          position: node.position,
          nodeData: node
        });
      }

      // Create synthetic single-tab layout nodes for tabs not in any multi-tab node.
      // Skip pinned/bookmark-owned tabs — they appear in the pin grid, not the sidebar.
      for (const tab of tabsData.tabs) {
        if (tabsInNodes.has(tab.id)) continue;
        if (tab.owner.kind !== "normal") continue;
        allLayoutNodeDatas.push({
          id: `s-${tab.uniqueId}`,
          mode: "single",
          profileId: tab.profileId,
          spaceId: tab.spaceId,
          tabIds: [tab.id],
          position: tab.position,
          nodeData: null
        });
      }

      const layoutNodes: TabLayoutNodeView[] = [];

      for (const nodeData of allLayoutNodeDatas) {
        const tabs: TabData[] = [];
        for (const tabId of nodeData.tabIds) {
          const tab = tabById.get(tabId);
          if (tab) {
            tabs.push(tab);
          }
        }

        if (tabs.length === 0) continue;

        const activeNodeId = activeNodeBySpace.get(nodeData.spaceId);
        // For synthetic single-tab nodes, check if any of their tabs match the active node
        let isActive = false;
        if (activeNodeId) {
          if (nodeData.id === activeNodeId) {
            isActive = true;
          } else if (nodeData.mode === "single" && !serializedLayoutNodeIds.has(activeNodeId)) {
            // Main omits single nodes from layoutNodes but still reports their
            // real ln-* IDs. The focused tab is the active single node's tab.
            const focusedTabId = tabsData.focusedTabIds[nodeData.spaceId];
            if (focusedTabId !== undefined && nodeData.tabIds.includes(focusedTabId)) {
              isActive = true;
            }
          }
        }

        const focusedTab = focusedTabBySpaceId.get(nodeData.spaceId) ?? null;

        const layoutNodeKey = `${nodeData.spaceId}:${nodeData.id}`;
        const previousEntry = previousLayoutNodeCache.get(layoutNodeKey);

        let layoutNode: TabLayoutNodeView;
        if (
          previousEntry &&
          previousEntry.source === nodeData.nodeData &&
          previousEntry.active === isActive &&
          previousEntry.focusedTab === focusedTab &&
          areSameTabRefs(previousEntry.tabs, tabs)
        ) {
          layoutNode = previousEntry.value;
        } else {
          layoutNode = {
            id: nodeData.id,
            mode: nodeData.mode,
            profileId: nodeData.profileId,
            spaceId: nodeData.spaceId,
            position: nodeData.position,
            tabIds: nodeData.tabIds,
            frontTabId: nodeData.frontTabId,
            tabs,
            active: isActive,
            focusedTab
          };
        }

        nextLayoutNodeCache.set(layoutNodeKey, {
          source: nodeData.nodeData,
          tabs,
          active: isActive,
          focusedTab,
          value: layoutNode
        });
        layoutNodes.push(layoutNode);

        const existingNodes = layoutNodesBySpaceId.get(nodeData.spaceId);
        if (existingNodes) {
          existingNodes.push(layoutNode);
        } else {
          layoutNodesBySpaceId.set(nodeData.spaceId, [layoutNode]);
        }

        if (isActive && !activeLayoutNodeBySpaceId.has(nodeData.spaceId)) {
          activeLayoutNodeBySpaceId.set(nodeData.spaceId, layoutNode);
        }
      }

      for (const [spaceId, spaceLayoutNodes] of layoutNodesBySpaceId) {
        spaceLayoutNodes.sort((a, b) => a.position - b.position);
        if (!activeLayoutNodeBySpaceId.has(spaceId)) {
          activeLayoutNodeBySpaceId.set(spaceId, null);
        }
        if (!focusedTabBySpaceId.has(spaceId)) {
          focusedTabBySpaceId.set(spaceId, null);
        }
      }

      return {
        layoutNodes,
        layoutNodesBySpaceId,
        activeLayoutNodeBySpaceId,
        focusedTabBySpaceId,
        nextLayoutNodeCache
      };
    }, [tabsData]);

  useEffect(() => {
    layoutNodeCacheRef.current = nextLayoutNodeCache;
  }, [nextLayoutNodeCache]);

  const getLayoutNodes = useCallback(
    (spaceId: string) => {
      return layoutNodesBySpaceId.get(spaceId) ?? EMPTY_LAYOUT_NODES;
    },
    [layoutNodesBySpaceId]
  );

  const getActiveLayoutNode = useCallback(
    (spaceId: string) => {
      return activeLayoutNodeBySpaceId.get(spaceId) ?? null;
    },
    [activeLayoutNodeBySpaceId]
  );

  const getFocusedTab = useCallback(
    (spaceId: string) => {
      return focusedTabBySpaceId.get(spaceId) ?? null;
    },
    [focusedTabBySpaceId]
  );

  const activeLayoutNode = useMemo(() => {
    if (!currentSpace) return null;
    return getActiveLayoutNode(currentSpace.id);
  }, [getActiveLayoutNode, currentSpace]);

  const focusedTab = useMemo(() => {
    if (!currentSpace) return null;
    return getFocusedTab(currentSpace.id);
  }, [getFocusedTab, currentSpace]);

  const addressUrl = useMemo(() => {
    if (!focusedTab) return "";

    const transformedUrl = transformUrlToDisplayURL(focusedTab.url);
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

  const layoutNodesContextValue = useMemo(
    () => ({
      layoutNodes,
      getLayoutNodes,
      getActiveLayoutNode,
      getFocusedTab,
      activeLayoutNode
    }),
    [layoutNodes, getLayoutNodes, getActiveLayoutNode, getFocusedTab, activeLayoutNode]
  );

  const focusedContextValue = useMemo(
    () => ({
      focusedTab,
      addressUrl
    }),
    [focusedTab, addressUrl]
  );
  // Use the raw numeric ID from the main process for the pin grid's
  // active-state detection, which compares against associatedTabId directly.
  const focusedTabId = (currentSpace && tabsData?.focusedTabIds[currentSpace.id]) ?? null;
  const isFocusedTabLoading = focusedTab?.isLoading ?? false;
  const isFocusedTabFullscreen = focusedTab?.fullScreen ?? false;

  const contextValue = useMemo(
    () => ({
      ...layoutNodesContextValue,
      ...focusedContextValue,
      // Utilities //
      tabsData,
      getActiveTabId,
      getFocusedTabId
    }),
    [layoutNodesContextValue, focusedContextValue, tabsData, getActiveTabId, getFocusedTabId]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <TabsLayoutNodesContext.Provider value={layoutNodesContextValue}>
        <TabsFocusedContext.Provider value={focusedContextValue}>
          <TabsFocusedIdContext.Provider value={focusedTabId}>
            <TabsFocusedLoadingContext.Provider value={isFocusedTabLoading}>
              <TabsFocusedFullscreenContext.Provider value={isFocusedTabFullscreen}>
                {children}
              </TabsFocusedFullscreenContext.Provider>
            </TabsFocusedLoadingContext.Provider>
          </TabsFocusedIdContext.Provider>
        </TabsFocusedContext.Provider>
      </TabsLayoutNodesContext.Provider>
    </TabsContext.Provider>
  );
};
