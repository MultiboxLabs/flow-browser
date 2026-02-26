import { cn, craftActiveFaviconURL } from "@/lib/utils";
import { XIcon, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

// --- SidebarTab --- //

function SidebarTab({ tab, isFocused }: { tab: TabData; isFocused: boolean }) {
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

  const handleClick = () => {
    if (!tab.id) return;
    flow.tabs.switchToTab(tab.id);
  };

  const handleCloseTab = (e: React.MouseEvent) => {
    if (!tab.id) return;
    e.preventDefault();
    flow.tabs.closeTab(tab.id);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      handleClick();
    }
    if (e.button === 1) {
      handleCloseTab(e);
    }
    setIsPressed(true);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tab.id) return;
    const newMutedState = !tab.muted;
    flow.tabs.setTabMuted(tab.id, newMutedState);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    flow.tabs.showContextMenu(tab.id);
  };

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
    <motion.div
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group/tab h-8 w-full rounded-lg overflow-hidden min-w-0",
        "flex items-center gap-2 px-2",
        "transition-[transform,background-color]",
        !isFocused && "hover:bg-black/10 dark:hover:bg-white/10",
        isFocused && "bg-black/15 dark:bg-white/15",
        isPressed ? "scale-99" : "scale-100"
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={() => setIsPressed(false)}
      animate={{ scale: isPressed ? 0.99 : 1 }}
      transition={{
        scale: { type: "spring", stiffness: 600, damping: 20 }
      }}
      layout
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
        <span className="ml-1 truncate min-w-0 flex-1 text-sm font-medium text-black/80 dark:text-white/80">
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
    </motion.div>
  );
}

// --- TabGroup (with drag-and-drop) --- //

interface TabGroupProps {
  tabGroup: TabGroupType;
  isActive: boolean;
  isFocused: boolean;
  isSpaceLight: boolean;
  position: number;
  moveTab: (tabId: number, newPosition: number) => void;
}

export function TabGroup({ tabGroup, isFocused, isSpaceLight, position, moveTab }: TabGroupProps) {
  const { tabs, focusedTab } = tabGroup;
  const ref = useRef<HTMLDivElement>(null);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

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
          primaryTabId: tabGroup.tabs[0].id,
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
  }, [moveTab, tabGroup.id, position, tabGroup.tabs, tabGroup.spaceId, tabGroup.profileId]);

  return (
    <>
      {closestEdge === "top" && <DropIndicator isSpaceLight={isSpaceLight} />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        layout
        className="space-y-0.5"
        ref={ref}
      >
        {tabs.map((tab) => (
          <SidebarTab key={tab.id} tab={tab} isFocused={isFocused && focusedTab?.id === tab.id} />
        ))}
      </motion.div>
      {closestEdge === "bottom" && <DropIndicator isSpaceLight={isSpaceLight} />}
    </>
  );
}
