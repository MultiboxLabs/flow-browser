import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PinnedTabData } from "~/types/pinned-tabs";

interface PinnedTabsContextValue {
  /** All pinned tabs grouped by profile ID */
  pinnedTabsByProfile: Record<string, PinnedTabData[]>;
  /** Get pinned tabs for a specific profile */
  getPinnedTabs: (profileId: string) => PinnedTabData[];
  /** Create a pinned tab from an existing browser tab */
  createFromTab: (tabId: number, position?: number) => Promise<PinnedTabData | null>;
  /** Click a pinned tab (activate or create associated tab) */
  click: (pinnedTabId: string) => Promise<boolean>;
  /** Double-click a pinned tab (navigate back to default URL) */
  doubleClick: (pinnedTabId: string) => Promise<boolean>;
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

  // Subscribe first, then fetch — closes the race window where a change
  // arrives between the initial fetch resolving and the listener registering.
  // The `settled` flag guards against the reverse race: if onChanged fires
  // before getData resolves, the stale getData result is discarded.
  useEffect(() => {
    let settled = false;
    const unsub = flow.pinnedTabs.onChanged((data) => {
      settled = true;
      setPinnedTabsByProfile(data);
    });
    flow.pinnedTabs.getData().then((data) => {
      if (!settled) {
        setPinnedTabsByProfile(data);
      }
    });
    return unsub;
  }, []);

  const getPinnedTabs = useCallback(
    (profileId: string) => {
      return pinnedTabsByProfile[profileId] ?? EMPTY_PINNED_TABS;
    },
    [pinnedTabsByProfile]
  );

  const createFromTab = useCallback(async (tabId: number, position?: number) => {
    return flow.pinnedTabs.createFromTab(tabId, position);
  }, []);

  const click = useCallback(async (pinnedTabId: string) => {
    return flow.pinnedTabs.click(pinnedTabId);
  }, []);

  const doubleClick = useCallback(async (pinnedTabId: string) => {
    return flow.pinnedTabs.doubleClick(pinnedTabId);
  }, []);

  const unpinToTabList = useCallback(async (pinnedTabId: string, position?: number) => {
    return flow.pinnedTabs.unpinToTabList(pinnedTabId, position);
  }, []);

  const reorder = useCallback(async (pinnedTabId: string, newPosition: number) => {
    // Optimistically update local state to mask IPC latency.
    // Mirror the backend logic: set the fractional position, sort, normalize.
    setPinnedTabsByProfile((prev) => {
      const next = { ...prev };
      for (const profileId of Object.keys(next)) {
        const tabs = next[profileId];
        const tabIndex = tabs.findIndex((t) => t.uniqueId === pinnedTabId);
        if (tabIndex === -1) continue;

        const updated = tabs.map((t) => (t.uniqueId === pinnedTabId ? { ...t, position: newPosition } : { ...t }));
        updated.sort((a, b) => a.position - b.position);
        updated.forEach((t, i) => (t.position = i));
        next[profileId] = updated;
        break;
      }
      return next;
    });

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
      unpinToTabList,
      reorder,
      showContextMenu
    }),
    [pinnedTabsByProfile, getPinnedTabs, createFromTab, click, doubleClick, unpinToTabList, reorder, showContextMenu]
  );

  return <PinnedTabsContext.Provider value={contextValue}>{children}</PinnedTabsContext.Provider>;
};
