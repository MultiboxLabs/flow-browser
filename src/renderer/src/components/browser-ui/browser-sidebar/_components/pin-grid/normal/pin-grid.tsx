import "../pin.css";

import { cn } from "@/lib/utils";
import { useMeasure } from "react-use";
import { useMemo } from "react";
import { PinnedTabButton } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button";
import { SidebarScrollArea } from "@/components/browser-ui/browser-sidebar/_components/sidebar-scroll-area";

export function PinGrid() {
  const [ref, { width }] = useMeasure<HTMLDivElement>();

  const amountOfPinnedTabs = 6;

  // Calculate columns based on container width
  // Minimum tab width: ~60px + gap (8px) = ~68px per column
  const cols = useMemo(() => {
    if (width > 0) {
      const minTabWidth = 60;
      const gap = 8; // gap-2 = 8px
      const calculatedCols = Math.max(1, Math.floor((width + gap) / (minTabWidth + gap)));
      return calculatedCols;
    }
    // Default placeholder value
    return 3;
  }, [width]);

  const gridColumnClass = {
    "grid-cols-1": cols >= 1 && amountOfPinnedTabs >= 1,
    "grid-cols-2": cols >= 2 && amountOfPinnedTabs >= 2,
    "grid-cols-3": cols >= 3 && amountOfPinnedTabs >= 3,
    "grid-cols-4": cols >= 4 && amountOfPinnedTabs >= 4,
    "grid-cols-5": cols >= 5 && amountOfPinnedTabs >= 5
  };

  return (
    <SidebarScrollArea className="max-h-40">
      <div ref={ref} className={cn("grid gap-2", gridColumnClass)}>
        {Array.from({ length: amountOfPinnedTabs }).map((_, index) => (
          <PinnedTabButton key={index} faviconUrl="https://www.google.com/favicon.ico" isActive={index === 0} />
        ))}
      </div>
    </SidebarScrollArea>
  );
}
