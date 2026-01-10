import "./pin.css";

import { cn } from "@/lib/utils";
import { useMeasure } from "react-use";
import { useEffect, useState } from "react";

export function PinnedTabButton({ faviconUrl, isActive }: { faviconUrl: string; isActive: boolean }) {
  return (
    <div
      className={cn(
        "w-full h-12 rounded-xl overflow-hidden",
        "bg-black/10 hover:bg-black/15",
        "dark:bg-white/15 dark:hover:bg-white/20",
        "transition-[background-color] duration-100",
        "flex items-center justify-center",
        isActive && "border-2 border-primary"
      )}
    >
      <div
        id="overlay"
        className={cn("size-full", "flex items-center justify-center", isActive && "bg-white/80 dark:bg-white/30")}
      >
        <div className="relative size-6">
          <img
            src={faviconUrl || undefined}
            className="absolute rounded-sm user-drag-none object-contain overflow-hidden"
          />
          <div className="img-container">
            <img src={faviconUrl || undefined} className="user-drag-none" />
          </div>
        </div>
        {/* <img src={faviconUrl || undefined} className="img-container" /> */}
      </div>
    </div>
  );
}

export function PinGrid() {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const [cols, setCols] = useState(2);

  const amountOfPinnedTabs = 100;

  // Calculate columns based on container width
  // Minimum tab width: ~60px + gap (8px) = ~68px per column
  useEffect(() => {
    if (width > 0) {
      const minTabWidth = 60;
      const gap = 8; // gap-2 = 8px
      const calculatedCols = Math.max(1, Math.floor((width + gap) / (minTabWidth + gap)));
      console.log(calculatedCols);
      setCols(calculatedCols);
    }
  }, [width]);

  return (
    <>
      <div
        ref={ref}
        className={cn("grid gap-2", "overflow-y-auto no-scrollbar max-h-40", {
          "grid-cols-1": cols >= 1 && amountOfPinnedTabs >= 1,
          "grid-cols-2": cols >= 2 && amountOfPinnedTabs >= 2,
          "grid-cols-3": cols >= 3 && amountOfPinnedTabs >= 3,
          "grid-cols-4": cols >= 4 && amountOfPinnedTabs >= 4,
          "grid-cols-5": cols >= 5 && amountOfPinnedTabs >= 5
        })}
      >
        {Array.from({ length: amountOfPinnedTabs }).map((_, index) => (
          <PinnedTabButton key={index} faviconUrl="https://www.google.com/favicon.ico" isActive={index === 0} />
        ))}
      </div>
    </>
  );
}
