import { cn, craftActiveFaviconURL } from "@/lib/utils";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useFocusedTabId, useTabs } from "@/components/providers/tabs-provider";
import type { TabData } from "~/types/tabs";

const MAX_MEDIA_CARDS = 5;
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Returns all tabs that have media activity (playing, paused, audible, or muted),
 * excluding the currently focused tab (the one the user is looking at).
 * Sorted by priority: playing > audible > paused > muted.
 */
function useMediaTabs(): TabData[] {
  const { tabsData } = useTabs();
  const focusedTabId = useFocusedTabId();

  return useMemo(() => {
    if (!tabsData?.tabs) return [];

    const playing: TabData[] = [];
    const audible: TabData[] = [];
    const paused: TabData[] = [];
    const muted: TabData[] = [];

    for (const tab of tabsData.tabs) {
      // Skip the tab the user is currently viewing
      if (tab.id === focusedTabId) continue;

      if (tab.mediaPlaybackState === "playing") {
        playing.push(tab);
      } else if (tab.audible) {
        audible.push(tab);
      } else if (tab.mediaPlaybackState === "paused") {
        paused.push(tab);
      } else if (tab.muted) {
        muted.push(tab);
      }
    }

    return [...playing, ...audible, ...paused, ...muted].slice(0, MAX_MEDIA_CARDS);
  }, [tabsData, focusedTabId]);
}

// --- Favicon --- //

function Favicon({
  tab,
  size = "size-4",
  faviconError,
  onFaviconError
}: {
  tab: TabData;
  size?: string;
  faviconError: boolean;
  onFaviconError: () => void;
}) {
  return (
    <div className={cn(size, "shrink-0")}>
      {tab.faviconURL && !faviconError ? (
        <img
          src={craftActiveFaviconURL(tab.id, tab.faviconURL)}
          alt=""
          className="size-full rounded-sm object-contain overflow-hidden"
          style={{ userSelect: "none", WebkitUserDrag: "none" } as React.CSSProperties}
          onError={onFaviconError}
        />
      ) : (
        <div className="size-full bg-gray-300 dark:bg-gray-300/30 rounded-sm" />
      )}
    </div>
  );
}

// --- MediaControlButton --- //

function MediaControlButton({
  icon: Icon,
  onClick,
  label,
  size = "size-3.5"
}: {
  icon: React.ComponentType<{ className?: string }>;
  onClick: (e: React.MouseEvent) => void;
  label: string;
  size?: string;
}) {
  return (
    <button
      className={cn(
        "size-6 flex items-center justify-center rounded-md",
        "hover:bg-black/10 dark:hover:bg-white/10",
        "active:bg-black/15 dark:active:bg-white/15",
        "transition-colors duration-100",
        "cursor-pointer"
      )}
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      title={label}
    >
      <Icon className={cn(size, "text-black/70 dark:text-white/70")} />
    </button>
  );
}

// --- MediaCard --- //

const MediaCard = memo(function MediaCard({
  tab,
  expanded,
  showStack
}: {
  tab: TabData;
  expanded: boolean;
  showStack: boolean;
}) {
  const [faviconError, setFaviconError] = useState(false);

  // Reset favicon error when the tab's favicon changes
  const [prevFavicon, setPrevFavicon] = useState(tab.faviconURL);
  if (tab.faviconURL !== prevFavicon) {
    setPrevFavicon(tab.faviconURL);
    setFaviconError(false);
  }

  const handleFaviconError = useCallback(() => setFaviconError(true), []);

  const handlePlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      flow.tabs.mediaPlayPause(tab.id);
    },
    [tab.id]
  );

  const handlePrevTrack = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      flow.tabs.mediaPreviousTrack(tab.id);
    },
    [tab.id]
  );

  const handleNextTrack = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      flow.tabs.mediaNextTrack(tab.id);
    },
    [tab.id]
  );

  const handleToggleMute = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      flow.tabs.setTabMuted(tab.id, !tab.muted);
    },
    [tab.id, tab.muted]
  );

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      flow.tabs.closeTab(tab.id);
    },
    [tab.id]
  );

  const handleSwitchToTab = useCallback(() => {
    flow.tabs.switchToTab(tab.id);
  }, [tab.id]);

  const displayTitle = tab.mediaTitle || tab.title;
  const isPlaying = tab.mediaPlaybackState === "playing" || (tab.audible && !tab.muted);

  return (
    <div className={cn("relative", showStack && !expanded && "pb-[5px]")}>
      {/* Fake stacked card behind (only for first card when collapsed and multiple tabs) */}
      {showStack && !expanded && (
        <div
          className={cn(
            "absolute left-[3px] right-[3px] top-[4px] bottom-0",
            "rounded-xl",
            "bg-white/60 dark:bg-neutral-800/60",
            "border border-black/5 dark:border-white/10"
          )}
        />
      )}

      {/* Actual card */}
      <div
        className={cn(
          "relative w-full rounded-xl overflow-hidden",
          "border border-black/10 dark:border-white/15",
          "bg-white dark:bg-neutral-900",
          "shadow-sm"
        )}
      >
        {/* Title row — only visible when expanded */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: 0.3,
                ease: EASE_OUT,
                opacity: { duration: 0.2 }
              }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "flex items-center gap-2 px-2.5 pt-2 pb-1",
                  "cursor-pointer",
                  "hover:bg-black/5 dark:hover:bg-white/5",
                  "transition-colors duration-100"
                )}
                onClick={handleSwitchToTab}
              >
                <Favicon tab={tab} size="size-4" faviconError={faviconError} onFaviconError={handleFaviconError} />
                <div className="flex-1 min-w-0 truncate text-xs font-medium text-black/90 dark:text-white/90">
                  {displayTitle}
                </div>
                <button
                  className={cn(
                    "size-5 flex items-center justify-center rounded-md shrink-0",
                    "hover:bg-black/10 dark:hover:bg-white/10",
                    "active:bg-black/15 dark:active:bg-white/15",
                    "transition-colors duration-100",
                    "cursor-pointer"
                  )}
                  onClick={handleClose}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Close tab"
                >
                  <X className="size-3 text-black/50 dark:text-white/50" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls row — always visible */}
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Favicon tab={tab} size="size-5" faviconError={faviconError} onFaviconError={handleFaviconError} />
          <MediaControlButton icon={SkipBack} onClick={handlePrevTrack} label="Previous track" size="size-3" />
          <MediaControlButton
            icon={isPlaying ? Pause : Play}
            onClick={handlePlayPause}
            label={isPlaying ? "Pause" : "Play"}
            size="size-4"
          />
          <MediaControlButton icon={SkipForward} onClick={handleNextTrack} label="Next track" size="size-3" />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Mute toggle */}
          <MediaControlButton
            icon={tab.muted ? VolumeX : Volume2}
            onClick={handleToggleMute}
            label={tab.muted ? "Unmute" : "Mute"}
            size="size-3.5"
          />
        </div>
      </div>
    </div>
  );
});

// --- GlobalMediaControls --- //

export const GlobalMediaControls = memo(function GlobalMediaControls() {
  const mediaTabs = useMediaTabs();
  const [hovered, setHovered] = useState(false);

  if (mediaTabs.length === 0) return null;

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <AnimatePresence initial={false}>
        {mediaTabs.map((tab, index) => (
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="shrink-0 overflow-hidden"
          >
            <MediaCard tab={tab} expanded={hovered} showStack={index === 0 && mediaTabs.length > 1} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
