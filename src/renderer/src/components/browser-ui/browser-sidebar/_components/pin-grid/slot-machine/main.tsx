import "../pin.css";

import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { PinVisual } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/pin-visual";

// ── Constants ──────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────

interface SlotState {
  domain: string;
}

function randomDomain(): string {
  return POPULAR_WEBSITES[Math.floor(Math.random() * POPULAR_WEBSITES.length)];
}

function createInitialSlots(): SlotState[] {
  return Array.from({ length: 9 }, () => ({ domain: randomDomain() }));
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

// ── External Store ─────────────────────────────────────────────────────
// All slot machine state and animation logic lives here, outside of React.
// Every mounted SlotMachinePinGrid instance subscribes via useSyncExternalStore
// so they all render the exact same snapshot – even during AnimatePresence
// overlap when both the exiting and entering sidebars coexist.

interface SlotMachineSnapshot {
  slots: SlotState[];
  isRolling: boolean;
  showWinners: boolean;
}

let snapshot: SlotMachineSnapshot = {
  slots: createInitialSlots(),
  isRolling: false,
  showWinners: false
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SlotMachineSnapshot {
  return snapshot;
}

function setSnapshot(partial: Partial<SlotMachineSnapshot>) {
  snapshot = { ...snapshot, ...partial };
  emit();
}

// ── Roll animation (runs entirely outside React) ───────────────────────

let rollTimeout: number | null = null;

function randomizeSlotsOnce() {
  const prev = snapshot.slots;
  const newTopRow: SlotState[] = Array.from({ length: 3 }, () => ({ domain: randomDomain() }));
  setSnapshot({ slots: [...newTopRow, ...prev.slice(0, 6)] });
}

function handleRoll() {
  if (snapshot.isRolling) return;

  setSnapshot({ isRolling: true, showWinners: false });

  let speed = 50;
  let shiftCount = 0;
  const totalShifts = 30;

  const spin = () => {
    randomizeSlotsOnce();
    shiftCount++;

    if (shiftCount > 20) {
      speed = speed + 20;
    }

    if (shiftCount < totalShifts) {
      rollTimeout = window.setTimeout(spin, speed);
    } else {
      // Finished spinning
      rollTimeout = window.setTimeout(() => {
        rollTimeout = null;
        const winners: [string, string, string] = [
          snapshot.slots[3].domain,
          snapshot.slots[4].domain,
          snapshot.slots[5].domain
        ];
        setSnapshot({ isRolling: false, showWinners: true });
        openWinnerTabs(winners);
      }, 300);
    }
  };

  spin();
}

// ── React Component ────────────────────────────────────────────────────

export function SlotMachinePinGrid() {
  const { slots, isRolling, showWinners } = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <>
      <div className={cn("grid grid-cols-3 gap-2", "overflow-hidden max-h-40")}>
        {slots.map((slot, index) => {
          const isWinner = showWinners && index >= 3 && index <= 5;

          return (
            <PinVisual
              key={index}
              faviconUrl={`https://www.google.com/s2/favicons?domain=${slot.domain}&sz=128`}
              isActive={isWinner}
            />
          );
        })}
      </div>
      <Button variant="secondary" onClick={handleRoll} disabled={isRolling} className="w-full">
        {isRolling ? "\u{1F3B0} Rolling..." : "\u{1F3B0} ROLL"}
      </Button>
    </>
  );
}

// Clean-up helper – can be called if the easter egg is toggled off.
export function resetSlotMachine() {
  if (rollTimeout !== null) {
    clearTimeout(rollTimeout);
    rollTimeout = null;
  }
  snapshot = {
    slots: createInitialSlots(),
    isRolling: false,
    showWinners: false
  };
  emit();
}
