import { PortalComponent } from "@/components/portal/portal";
import { useTabs } from "@/components/providers/tabs-provider";
import { craftActiveFaviconURL, cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ViewLayer } from "~/layers";
import type { TabSwitcherState } from "~/flow/interfaces/browser/tabs";
import type { TabData } from "~/types/tabs";

const MAX_VISIBLE_DISTANCE = 3;

type SnapshotMap = Record<number, string | null | undefined>;

function getPreviewOffset(index: number, selectedIndex: number, total: number): number {
  const direct = index - selectedIndex;
  const wrappedPositive = direct + total;
  const wrappedNegative = direct - total;

  return [direct, wrappedPositive, wrappedNegative].reduce((best, candidate) => {
    return Math.abs(candidate) < Math.abs(best) ? candidate : best;
  }, direct);
}

function getDisplayUrl(url: string): string {
  if (!url) return "New Tab";

  try {
    const parsed = new URL(url);
    return parsed.host || parsed.pathname || url;
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

function TabSwitcherCard({
  tab,
  snapshot,
  isSelected,
  offset
}: {
  tab: TabData;
  snapshot?: string | null;
  isSelected: boolean;
  offset: number;
}) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 w-[220px] sm:w-[240px] -translate-x-1/2 -translate-y-1/2"
      initial={false}
      animate={{
        x: offset * 170,
        scale: isSelected ? 1 : 0.84,
        opacity: Math.abs(offset) > MAX_VISIBLE_DISTANCE ? 0 : isSelected ? 1 : 0.6,
        filter: isSelected ? "blur(0px)" : "blur(0.3px)"
      }}
      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.9 }}
      style={{ zIndex: 100 - Math.abs(offset) }}
    >
      <div
        className={cn(
          "overflow-hidden rounded-[28px] border border-white/14 bg-black/65 shadow-[0_32px_80px_rgba(0,0,0,0.45)]",
          "backdrop-blur-xl",
          isSelected && "border-white/28"
        )}
      >
        <div className="aspect-[1.45] overflow-hidden bg-white/6">
          {snapshot ? (
            <img src={snapshot} alt={tab.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-white/14 via-white/6 to-transparent">
              <div className="flex flex-col items-center gap-3 text-white/75">
                {tab.faviconURL ? (
                  <img
                    src={craftActiveFaviconURL(tab.id, tab.faviconURL)}
                    alt=""
                    className="size-10 rounded-xl object-contain"
                  />
                ) : (
                  <div className="size-10 rounded-xl bg-white/16" />
                )}
                <span className="text-xs font-medium tracking-wide uppercase">
                  {tab.asleep ? "Sleeping tab" : "Loading preview"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-4 py-3 text-white">
          {tab.faviconURL ? (
            <img
              src={craftActiveFaviconURL(tab.id, tab.faviconURL)}
              alt=""
              className="size-5 rounded-md object-contain"
            />
          ) : (
            <div className="size-5 rounded-md bg-white/18" />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{tab.title || "New Tab"}</p>
            <p className="truncate text-xs text-white/58">{getDisplayUrl(tab.url)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TabSwitcher({ switcherState }: { switcherState: TabSwitcherState | null }) {
  const { tabsData } = useTabs();
  const [snapshots, setSnapshots] = useState<SnapshotMap>({});
  const requestIdRef = useRef(0);

  const orderedTabs = useMemo(() => {
    if (!switcherState || !tabsData) return [];

    const tabsById = new Map(tabsData.tabs.map((tab) => [tab.id, tab]));
    return switcherState.tabIds.map((tabId) => tabsById.get(tabId)).filter((tab): tab is TabData => !!tab);
  }, [switcherState, tabsData]);

  const selectedIndex = useMemo(() => {
    if (!switcherState) return -1;
    return orderedTabs.findIndex((tab) => tab.id === switcherState.selectedTabId);
  }, [orderedTabs, switcherState]);

  const isSwitcherVisible = switcherState !== null;
  const tabIdsKey = useMemo(() => orderedTabs.map((tab) => tab.id).join(","), [orderedTabs]);

  useEffect(() => {
    if (!isSwitcherVisible || orderedTabs.length === 0) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    flow.tabs.getTabSwitcherSnapshots(orderedTabs.map((tab) => tab.id)).then((results) => {
      if (requestId !== requestIdRef.current) return;

      const nextSnapshots: SnapshotMap = {};
      for (const result of results) {
        nextSnapshots[result.tabId] = result.dataUrl;
      }
      setSnapshots(nextSnapshots);
    });
  }, [isSwitcherVisible, orderedTabs, tabIdsKey]);

  const visibleTabs = useMemo(() => {
    if (selectedIndex < 0) return [];

    return orderedTabs
      .map((tab, index) => ({
        tab,
        offset: getPreviewOffset(index, selectedIndex, orderedTabs.length)
      }))
      .filter(({ offset }) => Math.abs(offset) <= MAX_VISIBLE_DISTANCE);
  }, [orderedTabs, selectedIndex]);

  return (
    <PortalComponent visible={isSwitcherVisible} zIndex={ViewLayer.OVERLAY} className="absolute inset-0">
      <AnimatePresence>
        {switcherState && selectedIndex >= 0 && visibleTabs.length > 0 && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-[220] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <div className="absolute inset-0 bg-black/18 backdrop-blur-[3px]" />

            <motion.div
              className="relative h-[260px] w-[min(1000px,calc(100vw-72px))] rounded-[40px] border border-white/12 bg-black/28 px-6 py-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 8 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              {visibleTabs.map(({ tab, offset }) => (
                <TabSwitcherCard
                  key={tab.id}
                  tab={tab}
                  snapshot={snapshots[tab.id]}
                  isSelected={tab.id === switcherState.selectedTabId}
                  offset={offset}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PortalComponent>
  );
}
