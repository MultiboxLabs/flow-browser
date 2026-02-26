import { cn, craftActiveFaviconURL } from "@/lib/utils";
import { XIcon, Volume2, VolumeX } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { TabGroup as TabGroupType } from "@/components/providers/tabs-provider";
import type { TabData } from "~/types/tabs";
import {
  draggable,
  dropTargetForElements,
  ElementDropTargetEventBasePayload
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge, Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { DropIndicator } from "@/components/browser-ui/browser-sidebar/_components/drop-indicator";

// --- Types --- //

export type TabGroupSourceData = {
  type: "tab-group";
  tabGroupId: string;
  primaryTabId: number;
  profileId: string;
  spaceId: string;
  position: number;
};

// --- SidebarTab (memoized) --- //

interface SidebarTabProps {
  tab: TabData;
  isFocused: boolean;
}

const SidebarTab = memo(
  function SidebarTab({ tab, isFocused }: SidebarTabProps) {
    const [cachedFaviconUrl, setCachedFaviconUrl] = useState<string | null>(tab.faviconURL);
    const [isError, setIsError] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const noFavicon = !cachedFaviconUrl || isError;

    const isMuted = tab.muted;
    const isPlayingAudio = tab.audible;

    useEffect(() => {
      if (tab.faviconURL) {
        setCachedFaviconUrl(tab.faviconURL);
      } else {
        setCachedFaviconUrl(null);
      }
      setIsError(false);
    }, [tab.faviconURL]);

    const handleClick = useCallback(() => {
      if (!tab.id) return;
      flow.tabs.switchToTab(tab.id);
    }, [tab.id]);

    const handleCloseTab = useCallback(
      (e: React.MouseEvent) => {
        if (!tab.id) return;
        e.preventDefault();
        flow.tabs.closeTab(tab.id);
      },
      [tab.id]
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 0) {
          handleClick();
        }
        if (e.button === 1) {
          handleCloseTab(e);
        }
        setIsPressed(true);
      },
      [handleClick, handleCloseTab]
    );

    const handleToggleMute = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!tab.id) return;
        const newMutedState = !tab.muted;
        flow.tabs.setTabMuted(tab.id, newMutedState);
      },
      [tab.id, tab.muted]
    );

    const handleContextMenu = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        flow.tabs.showContextMenu(tab.id);
      },
      [tab.id]
    );

    useEffect(() => {
      const handleMouseUp = () => {
        setIsPressed(false);
      };
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, []);

    const VolumeIcon = isMuted ? VolumeX : Volume2;

    return (
      <div
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group/tab h-9 w-full rounded-lg overflow-hidden min-w-0",
          "flex items-center gap-2 px-2",
          "transition-[transform,background-color]",
          !isFocused && "hover:bg-black/10 dark:hover:bg-white/10",
          isFocused && "bg-white/90 dark:bg-white/15",
          isPressed ? "scale-[0.99]" : "scale-100"
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={() => setIsPressed(false)}
      >
        {/* Left side: favicon + audio + title */}
        <div className="flex flex-row items-center flex-1 min-w-0">
          {/* Favicon */}
          <div className="size-4 shrink-0 mr-1">
            {!noFavicon && (
              <img
                src={craftActiveFaviconURL(tab.id, tab.faviconURL)}
                alt={tab.title}
                className="size-full rounded-sm object-contain overflow-hidden"
                style={{ userSelect: "none", WebkitUserDrag: "none" } as React.CSSProperties}
                onError={() => setIsError(true)}
              />
            )}
            {noFavicon && <div className="size-full bg-gray-300 dark:bg-gray-300/30 rounded-sm" />}
          </div>

          {/* Audio Indicator */}
          <AnimatePresence initial={false}>
            {(isPlayingAudio || isMuted) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center overflow-hidden shrink-0"
                onClick={handleToggleMute}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="size-5 flex items-center justify-center rounded-sm hover:bg-black/10 dark:hover:bg-white/10">
                  <VolumeIcon className={cn("size-3.5", "text-black/50 dark:text-white/50")} />
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Title */}
          <span className="ml-1 truncate min-w-0 flex-1 text-sm font-medium text-black/90 dark:text-white/90">
            {tab.title}
          </span>
        </div>

        {/* Right side: close button */}
        <div className="shrink-0 flex items-center">
          {isHovered && (
            <button
              className={cn(
                "size-5.5 shrink-0 rounded-sm p-0.5",
                "hover:bg-black/10 dark:hover:bg-white/10",
                "active:bg-black/15 dark:active:bg-white/15"
              )}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleCloseTab}
            >
              <XIcon className="size-4.5 text-black/60 dark:text-white/60" />
            </button>
          )}
        </div>
      </div>
    );
  },
  // Custom comparison: only rerender when the tab data we actually display changes
  (prev, next) => {
    return (
      prev.isFocused === next.isFocused &&
      prev.tab.id === next.tab.id &&
      prev.tab.title === next.tab.title &&
      prev.tab.url === next.tab.url &&
      prev.tab.faviconURL === next.tab.faviconURL &&
      prev.tab.muted === next.tab.muted &&
      prev.tab.audible === next.tab.audible &&
      prev.tab.isLoading === next.tab.isLoading
    );
  }
);

// --- TabGroup (memoized, with drag-and-drop) --- //

interface TabGroupProps {
  tabGroup: TabGroupType;
  isActive: boolean;
  isFocused: boolean;
  isSpaceLight: boolean;
  isFirst: boolean;
  position: number;
  groupCount: number;
  moveTab: (tabId: number, newPosition: number) => void;
}

export const TabGroup = memo(
  function TabGroup({ tabGroup, isFocused, isSpaceLight, isFirst, position, moveTab }: TabGroupProps) {
    const { tabs, focusedTab } = tabGroup;
    const ref = useRef<HTMLDivElement>(null);
    const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

    // Extract stable primitives for the drag-and-drop effect dependencies.
    // Previously, tabGroup.tabs (a new array each render) was in the dep array,
    // causing the effect to re-run on every tab data update.
    const primaryTabId = tabs[0]?.id;

    useEffect(() => {
      const el = ref.current;
      if (!el) return () => {};

      function onChange({ self }: ElementDropTargetEventBasePayload) {
        const edge = extractClosestEdge(self.data);
        setClosestEdge(edge);
      }

      function onDrop(args: ElementDropTargetEventBasePayload) {
        const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);
        setClosestEdge(null);

        const sourceData = args.source.data as TabGroupSourceData;
        const sourceTabId = sourceData.primaryTabId;

        let newPos: number | undefined = undefined;

        if (closestEdgeOfTarget === "top") {
          newPos = position - 0.5;
        } else if (closestEdgeOfTarget === "bottom") {
          newPos = position + 0.5;
        }

        if (sourceData.spaceId !== tabGroup.spaceId) {
          if (sourceData.profileId !== tabGroup.profileId) {
            // TODO: @MOVE_TABS_BETWEEN_PROFILES not supported yet
          } else {
            flow.tabs.moveTabToWindowSpace(sourceTabId, tabGroup.spaceId, newPos);
          }
        } else if (newPos !== undefined) {
          moveTab(sourceTabId, newPos);
        }
      }

      const draggableCleanup = draggable({
        element: el,
        getInitialData: () => {
          const data: TabGroupSourceData = {
            type: "tab-group",
            tabGroupId: tabGroup.id,
            primaryTabId: primaryTabId,
            profileId: tabGroup.profileId,
            spaceId: tabGroup.spaceId,
            position: position
          };
          return data;
        }
      });

      const cleanupDropTarget = dropTargetForElements({
        element: el,
        getData: ({ input, element }) => {
          return attachClosestEdge(
            {},
            {
              input,
              element,
              allowedEdges: ["top", "bottom"]
            }
          );
        },
        canDrop: (args) => {
          const sourceData = args.source.data as TabGroupSourceData;
          if (sourceData.type !== "tab-group") {
            return false;
          }
          if (sourceData.tabGroupId === tabGroup.id) {
            return false;
          }
          if (sourceData.profileId !== tabGroup.profileId) {
            return false;
          }
          return true;
        },
        onDrop: onDrop,
        onDragEnter: onChange,
        onDrag: onChange,
        onDragLeave: () => setClosestEdge(null)
      });

      return () => {
        draggableCleanup();
        cleanupDropTarget();
      };
    }, [moveTab, tabGroup.id, position, primaryTabId, tabGroup.spaceId, tabGroup.profileId]);

    return (
      <motion.div
        layout="position"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{
          layout: { type: "spring", stiffness: 500, damping: 35 },
          height: { type: "tween", duration: 0.2, ease: "easeOut" },
          opacity: { duration: 0.15 }
        }}
        style={{ overflow: "hidden" }}
        className="relative space-y-0.5"
        ref={ref}
      >
        {closestEdge === "top" && (
          <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
            <DropIndicator isSpaceLight={isSpaceLight} showTerminal={!isFirst} />
          </div>
        )}
        {tabs.map((tab) => (
          <SidebarTab key={tab.id} tab={tab} isFocused={isFocused && focusedTab?.id === tab.id} />
        ))}
        {closestEdge === "bottom" && (
          <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
            <DropIndicator isSpaceLight={isSpaceLight} />
          </div>
        )}
      </motion.div>
    );
  },
  // Custom comparison to avoid rerendering when tabGroup object reference changes
  // but the actual displayed data hasn't changed
  (prev, next) => {
    if (
      prev.isActive !== next.isActive ||
      prev.isFocused !== next.isFocused ||
      prev.isSpaceLight !== next.isSpaceLight ||
      prev.isFirst !== next.isFirst ||
      prev.position !== next.position ||
      prev.groupCount !== next.groupCount ||
      prev.moveTab !== next.moveTab ||
      prev.tabGroup.id !== next.tabGroup.id ||
      prev.tabGroup.spaceId !== next.tabGroup.spaceId ||
      prev.tabGroup.profileId !== next.tabGroup.profileId ||
      prev.tabGroup.focusedTab?.id !== next.tabGroup.focusedTab?.id ||
      prev.tabGroup.tabs.length !== next.tabGroup.tabs.length
    ) {
      return false;
    }
    // Deep-compare individual tabs (typically 1-5 per group)
    return prev.tabGroup.tabs.every((tab, i) => {
      const nextTab = next.tabGroup.tabs[i];
      return (
        tab.id === nextTab.id &&
        tab.title === nextTab.title &&
        tab.url === nextTab.url &&
        tab.faviconURL === nextTab.faviconURL &&
        tab.muted === nextTab.muted &&
        tab.audible === nextTab.audible &&
        tab.isLoading === nextTab.isLoading
      );
    });
  }
);
