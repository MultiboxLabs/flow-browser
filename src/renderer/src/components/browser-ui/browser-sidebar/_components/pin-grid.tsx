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
        "flex items-center justify-center"
        // isActive && "border-2 border-primary"
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
            <img src={faviconUrl || undefined} />
          </div>
        </div>
        {/* <img src={faviconUrl || undefined} className="img-container" /> */}
      </div>
    </div>
  );
}

const config = {
  theme: "dark",
  iconBlur: 28,
  iconSaturate: 5,
  iconBrightness: 1.3,
  iconContrast: 1.4,
  iconScale: 3.4,
  iconOpacity: 0.25,
  borderWidth: 3,
  borderBlur: 0,
  borderSaturate: 4.2,
  borderBrightness: 2.5,
  borderContrast: 2.5,
  exclude: false
};

export function PinGrid() {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const [cols, setCols] = useState(2);

  const amountOfPinnedTabs = 2;

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
        className={cn("grid gap-2", {
          "grid-cols-1": cols >= 1 && amountOfPinnedTabs >= 1,
          "grid-cols-2": cols >= 2 && amountOfPinnedTabs >= 2,
          "grid-cols-3": cols >= 3 && amountOfPinnedTabs >= 3,
          "grid-cols-4": cols >= 4 && amountOfPinnedTabs >= 4
        })}
        style={{
          "--icon-saturate": config.iconSaturate,
          "--icon-brightness": config.iconBrightness,
          "--icon-contrast": config.iconContrast,
          "--icon-scale": config.iconScale,
          "--icon-opacity": config.iconOpacity,
          "--border-width": config.borderWidth,
          "--border-blur": config.borderBlur,
          "--border-saturate": config.borderSaturate,
          "--border-brightness": config.borderBrightness,
          "--border-contrast": config.borderContrast
        }}
      >
        {Array.from({ length: amountOfPinnedTabs }).map((_, index) => (
          <PinnedTabButton key={index} faviconUrl="https://www.google.com/favicon.ico" isActive={index === 0} />
        ))}
      </div>

      <svg
        className="sr-only"
        style={{ overflow: "visible !important;" }}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <filter id="blur" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="28" />
        </filter>
      </svg>
    </>
  );
}
