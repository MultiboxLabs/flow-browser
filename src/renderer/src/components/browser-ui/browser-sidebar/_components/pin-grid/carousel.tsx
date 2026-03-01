import { useSpaces } from "@/components/providers/spaces-provider";
import { useEffect, useMemo, useState } from "react";
import { PinGrid } from "./normal/pin-grid";

// --- PinGridCarousel --- //
// A passive horizontal carousel that shows one PinGrid page per unique
// consecutive profile. Consecutive spaces sharing the same profile share
// a single page, so switching between them causes no scroll animation.
// Syncs with the current space — does NOT drive space changes on swipe.
//
// Uses CSS transform + transition instead of scroll-based animation so that
// the outer container doesn't need to be a scroll container. This avoids
// the CSS spec rule where `overflow-x: hidden` forces `overflow-y: auto`,
// which would create a vertical scroll context that interferes with the
// SidebarScrollArea inside each PinGrid page.

interface PageGroup {
  profileId: string;
  /** Key for React — uses the first space's ID in the group */
  key: string;
}

export function PinGridCarousel() {
  const { spaces, currentSpace } = useSpaces();
  const [animate, setAnimate] = useState(false);

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

  // Enable transitions after initial render so the first page snaps instantly.
  // Runs as an effect (not during render) to avoid mutating state/refs in the render phase.
  useEffect(() => {
    if (pages.length === 0) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [pages.length > 0]);

  return (
    <div className="shrink-0 overflow-clip">
      <div
        className="flex"
        style={{
          transform: `translateX(-${currentPageIndex * 100}%)`,
          transition: animate ? "transform 300ms ease" : "none"
        }}
      >
        {pages.map((page) => (
          <div key={page.key} className="min-w-full w-full shrink-0 px-1">
            <PinGrid profileId={page.profileId} />
          </div>
        ))}
      </div>
    </div>
  );
}
