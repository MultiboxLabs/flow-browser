import { cn, craftActiveFaviconURL } from "@/lib/utils";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTabs } from "@/components/providers/tabs-provider";
import type { TabData } from "~/types/tabs";

/**
 * Derives the "primary" media tab from all tabs in the window.
 * Priority: first tab with mediaPlaybackState "playing", then first audible
 * (non-muted) tab, then first muted tab that was playing.
 */
function usePrimaryMediaTab(): TabData | null {
  const { tabsData } = useTabs();

  return useMemo(() => {
    if (!tabsData?.tabs) return null;

    let playingTab: TabData | null = null;
    let audibleTab: TabData | null = null;
    let mutedTab: TabData | null = null;

    for (const tab of tabsData.tabs) {
      if (tab.mediaPlaybackState === "playing" && !playingTab) {
        playingTab = tab;
      }
      if (tab.audible && !audibleTab) {
        audibleTab = tab;
      }
      if (tab.muted && !tab.audible && !mutedTab) {
        mutedTab = tab;
      }
    }

    // Prefer tab with "playing" mediaSession state, then audible, then muted
    return playingTab ?? audibleTab ?? mutedTab ?? null;
  }, [tabsData]);
}

/**
 * Returns all tabs that are currently producing audio or are muted.
 */
function useMediaTabCount(): number {
  const { tabsData } = useTabs();

  return useMemo(() => {
    if (!tabsData?.tabs) return 0;
    return tabsData.tabs.filter((tab) => tab.audible || tab.muted).length;
  }, [tabsData]);
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

// --- GlobalMediaControls --- //

export const GlobalMediaControls = memo(function GlobalMediaControls() {
  const mediaTab = usePrimaryMediaTab();
  const mediaTabCount = useMediaTabCount();
  const [faviconError, setFaviconError] = useState(false);

  const handlePlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!mediaTab) return;
      flow.tabs.mediaPlayPause(mediaTab.id);
    },
    [mediaTab]
  );

  const handlePrevTrack = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!mediaTab) return;
      flow.tabs.mediaPreviousTrack(mediaTab.id);
    },
    [mediaTab]
  );

  const handleNextTrack = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!mediaTab) return;
      flow.tabs.mediaNextTrack(mediaTab.id);
    },
    [mediaTab]
  );

  const handleToggleMute = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!mediaTab) return;
      flow.tabs.setTabMuted(mediaTab.id, !mediaTab.muted);
    },
    [mediaTab]
  );

  const handleSwitchToTab = useCallback(() => {
    if (!mediaTab) return;
    flow.tabs.switchToTab(mediaTab.id);
  }, [mediaTab]);

  // Determine display values
  const displayTitle = useMemo(() => {
    if (!mediaTab) return "";
    // Use media metadata title if available, otherwise tab title
    return mediaTab.mediaTitle || mediaTab.title;
  }, [mediaTab]);

  const displayArtist = useMemo(() => {
    if (!mediaTab) return null;
    return mediaTab.mediaArtist || null;
  }, [mediaTab]);

  const isPlaying = mediaTab?.mediaPlaybackState === "playing" || (mediaTab?.audible && !mediaTab?.muted);

  // Reset favicon error when the media tab changes
  const currentTabId = mediaTab?.id;
  const [prevTabId, setPrevTabId] = useState<number | undefined>(undefined);
  if (currentTabId !== prevTabId) {
    setPrevTabId(currentTabId);
    setFaviconError(false);
  }

  return (
    <AnimatePresence>
      {mediaTab && (
        <motion.div
          key="global-media-controls"
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
            {/* Top row: favicon + title + mute button */}
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
                {mediaTab.faviconURL && !faviconError ? (
                  <img
                    src={craftActiveFaviconURL(mediaTab.id, mediaTab.faviconURL)}
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

              {/* Tab count badge */}
              {mediaTabCount > 1 && (
                <span className="shrink-0 text-[10px] font-medium text-black/40 dark:text-white/40">
                  +{mediaTabCount - 1}
                </span>
              )}
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
                icon={mediaTab.muted ? VolumeX : Volume2}
                onClick={handleToggleMute}
                label={mediaTab.muted ? "Unmute" : "Mute"}
                size="size-3.5"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
