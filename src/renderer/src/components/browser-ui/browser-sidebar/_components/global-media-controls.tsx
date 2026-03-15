import { cn, craftActiveFaviconURL } from "@/lib/utils";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useFocusedTabId, useTabs } from "@/components/providers/tabs-provider";
import type { TabData } from "~/types/tabs";

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

    return [...playing, ...audible, ...paused, ...muted];
  }, [tabsData, focusedTabId]);
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

const MediaCard = memo(function MediaCard({ tab }: { tab: TabData }) {
  const [faviconError, setFaviconError] = useState(false);

  // Reset favicon error when the tab's favicon changes
  const [prevFavicon, setPrevFavicon] = useState(tab.faviconURL);
  if (tab.faviconURL !== prevFavicon) {
    setPrevFavicon(tab.faviconURL);
    setFaviconError(false);
  }

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

  const handleSwitchToTab = useCallback(() => {
    flow.tabs.switchToTab(tab.id);
  }, [tab.id]);

  const displayTitle = tab.mediaTitle || tab.title;
  const displayArtist = tab.mediaArtist || null;
  const isPlaying = tab.mediaPlaybackState === "playing" || (tab.audible && !tab.muted);

  return (
    <motion.div
      key={tab.id}
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: "auto", marginTop: 8 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="shrink-0 overflow-hidden"
    >
      <div
        className={cn(
          "w-full rounded-xl overflow-hidden",
          "border border-black/10 dark:border-white/15",
          "bg-black/5 dark:bg-white/10"
        )}
      >
        {/* Top row: favicon + title */}
        <div
          className={cn(
            "flex items-center gap-2 px-2.5 pt-2 pb-1",
            "cursor-pointer",
            "hover:bg-black/5 dark:hover:bg-white/5",
            "transition-colors duration-100"
          )}
          onClick={handleSwitchToTab}
        >
          {/* Favicon */}
          <div className="size-4 shrink-0">
            {tab.faviconURL && !faviconError ? (
              <img
                src={craftActiveFaviconURL(tab.id, tab.faviconURL)}
                alt=""
                className="size-full rounded-sm object-contain overflow-hidden"
                style={{ userSelect: "none", WebkitUserDrag: "none" } as React.CSSProperties}
                onError={() => setFaviconError(true)}
              />
            ) : (
              <div className="size-full bg-gray-300 dark:bg-gray-300/30 rounded-sm" />
            )}
          </div>

          {/* Title + Artist */}
          <div className="flex-1 min-w-0">
            <div className="truncate text-xs font-medium text-black/90 dark:text-white/90">{displayTitle}</div>
            {displayArtist && (
              <div className="truncate text-[10px] text-black/50 dark:text-white/50">{displayArtist}</div>
            )}
          </div>
        </div>

        {/* Bottom row: playback controls */}
        <div className="flex items-center justify-center gap-1 px-2 pb-2 pt-0.5">
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
    </motion.div>
  );
});

// --- GlobalMediaControls --- //

export const GlobalMediaControls = memo(function GlobalMediaControls() {
  const mediaTabs = useMediaTabs();

  return (
    <AnimatePresence>
      {mediaTabs.map((tab) => (
        <MediaCard key={tab.id} tab={tab} />
      ))}
    </AnimatePresence>
  );
});
