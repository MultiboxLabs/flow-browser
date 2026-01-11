import "../pin.css";

import { cn } from "@/lib/utils";
import { useState, useCallback, useRef } from "react";
import { PinnedTabButton } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button";
import { Button } from "@/components/ui/button";
import { useUnmount } from "react-use";

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
            <PinnedTabButton
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
