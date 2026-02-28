import { useSpaces } from "@/components/providers/spaces-provider";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { PinGrid } from "./normal/pin-grid";

// --- PinGridCarousel --- //
// A passive horizontal carousel that shows one PinGrid page per space.
// Syncs with the current space — does NOT drive space changes on swipe.

export function PinGridCarousel() {
  const { spaces, currentSpace } = useSpaces();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  const currentIndex = useMemo(() => {
    if (!currentSpace) return 0;
    const idx = spaces.findIndex((s) => s.id === currentSpace.id);
    return idx === -1 ? 0 : idx;
  }, [currentSpace, spaces]);

  // Keep a ref so the ResizeObserver always reads the latest index
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Set initial scroll position instantly (before first paint)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      container.scrollLeft = currentIndex * container.clientWidth;
    }
  }, [currentIndex]);

  // When current space changes, smooth-scroll to the corresponding page
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasInitializedRef.current) return;

    const targetScrollLeft = currentIndex * container.clientWidth;
    if (Math.abs(container.scrollLeft - targetScrollLeft) < 2) return;

    container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
  }, [currentIndex]);

  // Re-snap on container resize so the active page stays aligned
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let lastWidth = container.clientWidth;

    const observer = new ResizeObserver((entries) => {
      const newWidth = entries[0]?.contentRect.width ?? container.clientWidth;
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
      className={cn("shrink-0", "flex overflow-x-hidden overflow-y-hidden", "[&::-webkit-scrollbar]:hidden")}
      style={{ scrollbarWidth: "none" }}
    >
      {spaces.map((space) => (
        <div key={space.id} className="min-w-full w-full shrink-0">
          <PinGrid profileId={space.profileId} />
        </div>
      ))}
    </div>
  );
}
