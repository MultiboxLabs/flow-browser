import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PageBounds } from "~/flow/types";
import type { TabDialogRequest, TabDialogResult } from "~/types/tab-dialogs";
import { useFocusedTabId } from "@/components/providers/tabs-provider";

interface TabOverlayContextValue {
  pageBounds: PageBounds | null;
  dialogQueue: TabDialogRequest[];
  respondToDialog: (dialogId: string, result: TabDialogResult) => void;
  suppressDialogs: (tabId: number) => void;
  isTabSuppressed: (tabId: number) => boolean;
}

const TabOverlayContext = createContext<TabOverlayContextValue | null>(null);

export function useTabOverlay() {
  const context = useContext(TabOverlayContext);
  if (!context) {
    throw new Error("useTabOverlay must be used within a TabOverlayProvider");
  }
  return context;
}

export function usePageBounds() {
  const { pageBounds } = useTabOverlay();
  return pageBounds;
}

export function TabOverlayProvider({ children }: { children: React.ReactNode }) {
  const [pageBounds, setPageBounds] = useState<PageBounds | null>(null);
  const [dialogQueue, setDialogQueue] = useState<TabDialogRequest[]>([]);
  const suppressedTabsRef = useRef<Set<number>>(new Set());
  const focusedTabId = useFocusedTabId();

  useEffect(() => {
    flow.page.getPageBounds().then(setPageBounds);
    const unsub = flow.page.onPageBoundsChanged((bounds) => {
      setPageBounds(bounds);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = flow.tabDialogs.onShow((request: TabDialogRequest) => {
      if (suppressedTabsRef.current.has(request.tabId)) {
        const autoResult = getDefaultResult(request.type);
        flow.tabDialogs.respond(request.dialogId, autoResult);
        return;
      }
      setDialogQueue((prev) => [...prev, request]);
    });
    return unsub;
  }, []);

  const respondToDialog = useCallback((dialogId: string, result: TabDialogResult) => {
    flow.tabDialogs.respond(dialogId, result);
    setDialogQueue((prev) => prev.filter((d) => d.dialogId !== dialogId));
  }, []);

  const suppressDialogs = useCallback((tabId: number) => {
    suppressedTabsRef.current.add(tabId);
    setDialogQueue((prev) => {
      const remaining: TabDialogRequest[] = [];
      for (const d of prev) {
        if (d.tabId === tabId) {
          const autoResult = getDefaultResult(d.type);
          flow.tabDialogs.respond(d.dialogId, autoResult);
        } else {
          remaining.push(d);
        }
      }
      return remaining;
    });
  }, []);

  const isTabSuppressed = useCallback((tabId: number) => {
    return suppressedTabsRef.current.has(tabId);
  }, []);

  const visibleDialogs = useMemo(
    () => dialogQueue.filter((d) => d.tabId === focusedTabId),
    [dialogQueue, focusedTabId]
  );

  const contextValue = useMemo(
    () => ({
      pageBounds,
      dialogQueue: visibleDialogs,
      respondToDialog,
      suppressDialogs,
      isTabSuppressed
    }),
    [pageBounds, visibleDialogs, respondToDialog, suppressDialogs, isTabSuppressed]
  );

  return <TabOverlayContext.Provider value={contextValue}>{children}</TabOverlayContext.Provider>;
}

function getDefaultResult(type: string): TabDialogResult {
  switch (type) {
    case "alert":
      return { type: "alert" };
    case "confirm":
      return { type: "confirm", confirmed: false };
    case "prompt":
      return { type: "prompt", value: null };
    default:
      return { type: "alert" };
  }
}
