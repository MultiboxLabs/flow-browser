import { useSpaces } from "@/components/providers/spaces-provider";
import { useTabsGroups } from "@/components/providers/tabs-provider";
import { usePinnedTabs } from "@/components/providers/pinned-tabs-provider";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { SidebarScrollArea } from "./sidebar-scroll-area";
import { SpaceTitle } from "./space-title";
import { NewTabButton } from "./new-tab-button";
import { TabGroup } from "./tab-group";
import { TabDropTarget } from "./tab-drop-target";
import { AnimatePresence } from "motion/react";
import type { Space } from "~/flow/interfaces/sessions/spaces";
import { cn, hex_is_light } from "@/lib/utils";

// --- SpaceContentPage --- //
// Renders the full content for a single space: title, scroll area with tab groups, and drop target.

interface SpaceContentPageProps {
  space: Space;
  moveTab: (tabId: number, newPosition: number) => void;
}

const SpaceContentPage = memo(function SpaceContentPage({ space, moveTab }: SpaceContentPageProps) {
  const { getTabGroups, getActiveTabGroup, getFocusedTab } = useTabsGroups();
  const { unpinToTabList } = usePinnedTabs();
  const isSpaceLight = useMemo(() => hex_is_light(space.bgStartColor || "#000000"), [space.bgStartColor]);

  // Ephemeral tabs (pinned-tab-associated) are already filtered out by the
  // tabs provider, so getTabGroups returns only visible tab groups.
  const sortedTabGroups = useMemo(() => getTabGroups(space.id), [space.id, getTabGroups]);
  const activeTabGroup = useMemo(() => getActiveTabGroup(space.id), [getActiveTabGroup, space.id]);
  const focusedTab = useMemo(() => getFocusedTab(space.id), [getFocusedTab, space.id]);

  return (
    <div className="min-w-full w-full shrink-0 snap-start snap-always flex flex-col min-h-0 h-full">
      <SpaceTitle space={space} />
      <SidebarScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-1 flex-1 min-h-full pt-1">
          <NewTabButton />
          <AnimatePresence initial={false}>
            {sortedTabGroups.map((tabGroup) => (
              <TabGroup
                key={tabGroup.id}
                tabGroup={tabGroup}
                isActive={activeTabGroup?.id === tabGroup.id}
                isFocused={!!focusedTab && tabGroup.tabs.some((tab) => tab.id === focusedTab.id)}
                isSpaceLight={isSpaceLight}
                position={tabGroup.position}
                groupCount={sortedTabGroups.length}
                moveTab={moveTab}
                unpinToTabList={unpinToTabList}
              />
            ))}
          </AnimatePresence>
          <TabDropTarget
            spaceData={space}
            isSpaceLight={isSpaceLight}
            moveTab={moveTab}
            biggestIndex={sortedTabGroups.length > 0 ? sortedTabGroups[sortedTabGroups.length - 1].position : -1}
          />
        </div>
      </SidebarScrollArea>
    </div>
  );
});

// --- SpacePagesCarousel --- //
// A horizontal scroll container with snap points for each space.
// Supports trackpad swipe gestures and programmatic smooth-scrolling when the active space changes.

export function SpacePagesCarousel() {
  const { spaces, currentSpace, setCurrentSpace } = useSpaces();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Tracks the space ID that a swipe just switched to, so we can skip
  // the programmatic smooth-scroll for that specific change.
  // Using a space ID (not a boolean) prevents stale flags from suppressing
  // unrelated programmatic scrolls if setCurrentSpace no-ops or fails.
  const skipScrollForSpaceRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  const moveTab = useCallback((tabId: number, newPosition: number) => {
    flow.tabs.moveTab(tabId, newPosition);
  }, []);

  const currentIndex = useMemo(() => {
    if (!currentSpace) return 0;
    const idx = spaces.findIndex((s) => s.id === currentSpace.id);
    return idx === -1 ? 0 : idx;
  }, [currentSpace, spaces]);

  // Keep a ref so the ResizeObserver (created once) always reads the latest index
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Set initial scroll position instantly (before first paint).
  // Also handles the case where currentSpace resolves late (e.g. async fetch):
  // re-runs whenever currentIndex changes, but only snaps instantly if not yet initialized.
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      container.scrollLeft = currentIndex * container.clientWidth;
    }
  }, [currentIndex]);

  // When current space changes externally (e.g. space switcher click),
  // smooth-scroll to the corresponding page
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasInitializedRef.current) return;

    // If this change originated from a swipe to this exact space, skip programmatic scroll
    if (skipScrollForSpaceRef.current === currentSpace?.id) {
      skipScrollForSpaceRef.current = null;
      return;
    }
    skipScrollForSpaceRef.current = null;

    const targetScrollLeft = currentIndex * container.clientWidth;
    if (Math.abs(container.scrollLeft - targetScrollLeft) < 2) return;

    container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
  }, [currentIndex, currentSpace?.id]);

  // Detect when the user finishes swiping and update the current space.
  // Uses `scrollend` with a debounced `scroll` fallback for robustness.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimer: ReturnType<typeof setTimeout> | null = null;

    const resolveSnap = () => {
      const pageWidth = container.clientWidth;
      if (pageWidth === 0) return;

      const index = Math.round(container.scrollLeft / pageWidth);
      const clampedIndex = Math.max(0, Math.min(index, spaces.length - 1));
      const targetSpace = spaces[clampedIndex];

      if (targetSpace && targetSpace.id !== currentSpace?.id) {
        skipScrollForSpaceRef.current = targetSpace.id;
        setCurrentSpace(targetSpace.id);
      }
    };

    const handleScrollEnd = () => {
      // Clear debounce timer since the native event fired
      if (scrollTimer !== null) {
        clearTimeout(scrollTimer);
        scrollTimer = null;
      }
      resolveSnap();
    };

    // Debounced fallback: if `scrollend` isn't supported or doesn't fire,
    // detect scroll settling after 150ms of inactivity
    const handleScroll = () => {
      if (scrollTimer !== null) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(resolveSnap, 150);
    };

    container.addEventListener("scrollend", handleScrollEnd);
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scrollend", handleScrollEnd);
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimer !== null) clearTimeout(scrollTimer);
    };
  }, [spaces, currentSpace, setCurrentSpace]);

  // Re-snap on container resize so the active page stays aligned.
  // Created once — reads currentIndex from a ref so it doesn't recreate
  // (ResizeObserver fires its callback immediately on .observe(), which
  // would race with the smooth-scroll effect if recreated on every index change).
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let lastWidth = container.clientWidth;

    const observer = new ResizeObserver((entries) => {
      const newWidth = entries[0]?.contentRect.width ?? container.clientWidth;
      // Only re-snap when the width actually changed (skip the initial observe callback)
      if (Math.abs(newWidth - lastWidth) < 1) return;
      lastWidth = newWidth;
      container.scrollLeft = currentIndexRef.current * newWidth;
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "flex-1 min-h-0",
        "flex overflow-x-auto overflow-y-hidden",
        "snap-x snap-mandatory",
        "overscroll-x-contain",
        "[&::-webkit-scrollbar]:hidden"
      )}
      style={{ scrollbarWidth: "none" }}
    >
      {spaces.map((space) => (
        <SpaceContentPage key={space.id} space={space} moveTab={moveTab} />
      ))}
    </div>
  );
}
