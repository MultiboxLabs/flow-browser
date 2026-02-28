import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PinnedTabData } from "~/types/pinned-tabs";

interface PinnedTabsContextValue {
  /** All pinned tabs grouped by profile ID */
  pinnedTabsByProfile: Record<string, PinnedTabData[]>;
  /** Get pinned tabs for a specific profile */
  getPinnedTabs: (profileId: string) => PinnedTabData[];
  /** Create a pinned tab from an existing browser tab */
  createFromTab: (tabId: number) => Promise<PinnedTabData | null>;
  /** Click a pinned tab (activate or create associated tab) */
  click: (pinnedTabId: string) => Promise<boolean>;
  /** Double-click a pinned tab (navigate back to default URL) */
  doubleClick: (pinnedTabId: string) => Promise<boolean>;
  /** Remove a pinned tab */
  remove: (pinnedTabId: string) => Promise<boolean>;
  /** Unpin a tab back to the tab list (removes pin + makes associated tab persistent) */
  unpinToTabList: (pinnedTabId: string, position?: number) => Promise<boolean>;
  /** Reorder a pinned tab to a new position */
  reorder: (pinnedTabId: string, newPosition: number) => Promise<boolean>;
  /** Show context menu for a pinned tab */
  showContextMenu: (pinnedTabId: string) => void;
}

const PinnedTabsContext = createContext<PinnedTabsContextValue | null>(null);

const EMPTY_PINNED_TABS: PinnedTabData[] = [];

export const usePinnedTabs = () => {
  const context = useContext(PinnedTabsContext);
  if (!context) {
    throw new Error("usePinnedTabs must be used within a PinnedTabsProvider");
  }
  return context;
};

interface PinnedTabsProviderProps {
  children: React.ReactNode;
}

export const PinnedTabsProvider = ({ children }: PinnedTabsProviderProps) => {
  const [pinnedTabsByProfile, setPinnedTabsByProfile] = useState<Record<string, PinnedTabData[]>>({});

  // Initial fetch
  useEffect(() => {
    flow.pinnedTabs.getData().then((data) => {
      setPinnedTabsByProfile(data);
    });
  }, []);

  // Listen for changes
  useEffect(() => {
    const unsub = flow.pinnedTabs.onChanged((data) => {
      setPinnedTabsByProfile(data);
    });
    return unsub;
  }, []);

  const getPinnedTabs = useCallback(
    (profileId: string) => {
      return pinnedTabsByProfile[profileId] ?? EMPTY_PINNED_TABS;
    },
    [pinnedTabsByProfile]
  );

  const createFromTab = useCallback(async (tabId: number) => {
    return flow.pinnedTabs.createFromTab(tabId);
  }, []);

  const click = useCallback(async (pinnedTabId: string) => {
    return flow.pinnedTabs.click(pinnedTabId);
  }, []);

  const doubleClick = useCallback(async (pinnedTabId: string) => {
    return flow.pinnedTabs.doubleClick(pinnedTabId);
  }, []);

  const remove = useCallback(async (pinnedTabId: string) => {
    return flow.pinnedTabs.remove(pinnedTabId);
  }, []);

  const unpinToTabList = useCallback(async (pinnedTabId: string, position?: number) => {
    return flow.pinnedTabs.unpinToTabList(pinnedTabId, position);
  }, []);

  const reorder = useCallback(async (pinnedTabId: string, newPosition: number) => {
    return flow.pinnedTabs.reorder(pinnedTabId, newPosition);
  }, []);

  const showContextMenu = useCallback((pinnedTabId: string) => {
    flow.pinnedTabs.showContextMenu(pinnedTabId);
  }, []);

  const contextValue = useMemo(
    () => ({
      pinnedTabsByProfile,
      getPinnedTabs,
      createFromTab,
      click,
      doubleClick,
      remove,
      unpinToTabList,
      reorder,
      showContextMenu
    }),
    [
      pinnedTabsByProfile,
      getPinnedTabs,
      createFromTab,
      click,
      doubleClick,
      remove,
      unpinToTabList,
      reorder,
      showContextMenu
    ]
  );

  return <PinnedTabsContext.Provider value={contextValue}>{children}</PinnedTabsContext.Provider>;
};
