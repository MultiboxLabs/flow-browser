import "../pin.css";

import { cn } from "@/lib/utils";
import { useState, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useUnmount } from "react-use";
import { useFaviconColors, type FaviconColors, type RGB } from "@/hooks/use-favicon-color";

/**
 * Convert RGB to rgba string
 */
function rgba(color: RGB | null, opacity: number): string {
  if (!color) return `rgba(255, 255, 255, ${opacity})`;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
}

/**
 * Generate a border gradient using corner colors
 */
function generateBorderGradient(colors: FaviconColors, opacity: number): string {
  const tl = rgba(colors.topLeft, opacity);
  const tr = rgba(colors.topRight, opacity);
  const br = rgba(colors.bottomRight, opacity);
  const bl = rgba(colors.bottomLeft, opacity);
  return `conic-gradient(from 45deg, ${tr} 0deg, ${br} 90deg, ${bl} 180deg, ${tl} 270deg, ${tr} 360deg)`;
}

/**
 * Simple slot button — visual only, no drag-and-drop or context menus.
 */
function SlotButton({ faviconUrl, isActive }: { faviconUrl: string; isActive: boolean }) {
  const faviconColors = useFaviconColors(faviconUrl);
  const hasColors = faviconColors !== null;

  const activeBorderStyle = useMemo(() => {
    if (!isActive || !hasColors) return undefined;
    return {
      "--gradient-border": generateBorderGradient(faviconColors, 0.6)
    } as React.CSSProperties;
  }, [faviconColors, hasColors, isActive]);

  const activeOverlayStyle = useMemo(() => {
    if (!isActive || !hasColors) return undefined;
    return {
      backgroundImage: generateBorderGradient(faviconColors, 0.15)
    } as React.CSSProperties;
  }, [faviconColors, hasColors, isActive]);

  return (
    <div
      className={cn(
        "w-full h-12 rounded-xl overflow-hidden cursor-pointer",
        "bg-black/10 hover:bg-black/15",
        "dark:bg-white/15 dark:hover:bg-white/20",
        "transition-[background-color,border-color,opacity] duration-100",
        "flex items-center justify-center",
        isActive && !hasColors && "border-2 border-white",
        isActive && hasColors && "pinned-tab-active-border"
      )}
      style={activeBorderStyle}
    >
      <div id="overlay-overlay" className={cn("size-full", isActive && "bg-white/80 dark:bg-white/30")}>
        <div id="overlay" className={cn("size-full", "flex items-center justify-center")} style={activeOverlayStyle}>
          <div className="relative size-5">
            <img
              src={faviconUrl || undefined}
              className="absolute rounded-sm user-drag-none object-contain overflow-hidden"
            />
            <div className="img-container">
              <img src={faviconUrl || undefined} className="user-drag-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const POPULAR_WEBSITES: string[] = [
  "youtube.com",
  "google.com",
  "facebook.com",
  "twitter.com",
  "instagram.com",
  "reddit.com",
  "wikipedia.org",
  "amazon.com",
  "netflix.com",
  "github.com",
  "linkedin.com",
  "twitch.tv",
  "spotify.com",
  "apple.com",
  "microsoft.com",
  "discord.com",
  "tiktok.com",
  "pinterest.com",
  "stackoverflow.com",
  "medium.com"
];

interface SlotState {
  domain: string;
}

function openWinnerTabs(domains: [string, string, string]) {
  const [a, b, c] = domains;
  const url = (domain: string) => `https://${domain}`;

  if (a === b && b === c) {
    // Jackpot: all 3 same -> open 9 tabs
    for (let i = 0; i < 9; i++) {
      flow.tabs.newTab(url(a), false);
    }
  } else if (a === b) {
    // 2 match (a, b) + 1 different (c)
    for (let i = 0; i < 4; i++) {
      flow.tabs.newTab(url(a), false);
    }
    flow.tabs.newTab(url(c), false);
  } else if (a === c) {
    // 2 match (a, c) + 1 different (b)
    for (let i = 0; i < 4; i++) {
      flow.tabs.newTab(url(a), false);
    }
    flow.tabs.newTab(url(b), false);
  } else if (b === c) {
    // 2 match (b, c) + 1 different (a)
    for (let i = 0; i < 4; i++) {
      flow.tabs.newTab(url(b), false);
    }
    flow.tabs.newTab(url(a), false);
  } else {
    // All different -> open 1 tab each
    flow.tabs.newTab(url(a), false);
    flow.tabs.newTab(url(b), false);
    flow.tabs.newTab(url(c), false);
  }
}

export function SlotMachinePinGrid() {
  const [slots, setSlots] = useState<SlotState[]>(() =>
    Array.from({ length: 9 }, () => ({
      domain: POPULAR_WEBSITES[Math.floor(Math.random() * POPULAR_WEBSITES.length)]
    }))
  );

  const [isRolling, setIsRolling] = useState(false);
  const [showWinners, setShowWinners] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const randomizeSlotsOnce = useCallback(() => {
    // Shift down and add new top row
    setSlots((prev) => {
      const newTopRow = Array.from({ length: 3 }, () => ({
        domain: POPULAR_WEBSITES[Math.floor(Math.random() * POPULAR_WEBSITES.length)]
      }));
      return [...newTopRow, ...prev.slice(0, 6)];
    });
  }, []);

  const handleRoll = useCallback(() => {
    if (isRolling) return;

    setIsRolling(true);
    setShowWinners(false);

    let speed = 50; // Start fast (50ms between shifts)
    let shiftCount = 0;
    const totalShifts = 30; // Total number of shifts

    const spin = () => {
      randomizeSlotsOnce();
      shiftCount++;

      // Start slowing down after 20 shifts
      if (shiftCount > 20) {
        speed = speed + 20; // Slow down progressively
      }

      if (shiftCount < totalShifts) {
        timeoutRef.current = window.setTimeout(spin, speed);
      } else {
        // Finished spinning
        setTimeout(() => {
          setShowWinners(true);
          setIsRolling(false);
          setSlots((currentSlots) => {
            const winners: [string, string, string] = [
              currentSlots[3].domain,
              currentSlots[4].domain,
              currentSlots[5].domain
            ];
            openWinnerTabs(winners);
            return currentSlots;
          });
        }, 300);
      }
    };

    spin();
  }, [isRolling, randomizeSlotsOnce]);

  useUnmount(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  });

  return (
    <>
      <div className={cn("grid grid-cols-3 gap-2", "overflow-hidden max-h-40")}>
        {slots.map((slot, index) => {
          // Middle row indices are 3, 4, 5
          const isWinner = showWinners && index >= 3 && index <= 5;

          return (
            <SlotButton
              key={index}
              faviconUrl={`https://www.google.com/s2/favicons?domain=${slot.domain}&sz=128`}
              isActive={isWinner}
            />
          );
        })}
      </div>
      <Button variant="secondary" onClick={handleRoll} disabled={isRolling} className="w-full">
        {isRolling ? "🎰 Rolling..." : "🎰 ROLL"}
      </Button>
    </>
  );
}
