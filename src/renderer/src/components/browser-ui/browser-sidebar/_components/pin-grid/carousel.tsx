import { useSpaces } from "@/components/providers/spaces-provider";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { PinGrid } from "./normal/pin-grid";

// --- PinGridCarousel --- //
// A passive horizontal carousel that shows one PinGrid page per unique
// consecutive profile. Consecutive spaces sharing the same profile share
// a single page, so switching between them causes no scroll animation.
// Syncs with the current space — does NOT drive space changes on swipe.

interface PageGroup {
  profileId: string;
  /** Key for React — uses the first space's ID in the group */
  key: string;
}

export function PinGridCarousel() {
  const { spaces, currentSpace } = useSpaces();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // Group consecutive spaces with the same profile into pages.
  // Also build a mapping from space index → page index.
  const { pages, spaceIndexToPage } = useMemo(() => {
    const pages: PageGroup[] = [];
    const spaceIndexToPage: number[] = [];

    for (let i = 0; i < spaces.length; i++) {
      const space = spaces[i];
      if (pages.length === 0 || pages[pages.length - 1].profileId !== space.profileId) {
        pages.push({ profileId: space.profileId, key: space.id });
      }
      spaceIndexToPage.push(pages.length - 1);
    }

    return { pages, spaceIndexToPage };
  }, [spaces]);

  const currentSpaceIndex = useMemo(() => {
    if (!currentSpace) return 0;
    const idx = spaces.findIndex((s) => s.id === currentSpace.id);
    return idx === -1 ? 0 : idx;
  }, [currentSpace, spaces]);

  const currentPageIndex = spaceIndexToPage[currentSpaceIndex] ?? 0;

  // Keep a ref so the ResizeObserver always reads the latest page index
  const currentPageIndexRef = useRef(currentPageIndex);
  currentPageIndexRef.current = currentPageIndex;

  // Set initial scroll position instantly (before first paint)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      container.scrollLeft = currentPageIndex * container.clientWidth;
    }
  }, [currentPageIndex]);

  // When current page changes, smooth-scroll to the corresponding page
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasInitializedRef.current) return;

    const targetScrollLeft = currentPageIndex * container.clientWidth;
    if (Math.abs(container.scrollLeft - targetScrollLeft) < 2) return;

    container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
  }, [currentPageIndex]);

  // Re-snap on container resize so the active page stays aligned
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let lastWidth = container.clientWidth;

    const observer = new ResizeObserver((entries) => {
      const newWidth = entries[0]?.contentRect.width ?? container.clientWidth;
      if (Math.abs(newWidth - lastWidth) < 1) return;
      lastWidth = newWidth;
      container.scrollLeft = currentPageIndexRef.current * newWidth;
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className={cn("shrink-0", "flex overflow-x-hidden overflow-y-hidden", "[&::-webkit-scrollbar]:hidden")}
      style={{ scrollbarWidth: "none" }}
    >
      {pages.map((page) => (
        <div key={page.key} className="min-w-full w-full shrink-0 px-1">
          <PinGrid profileId={page.profileId} />
        </div>
      ))}
    </div>
  );
}
