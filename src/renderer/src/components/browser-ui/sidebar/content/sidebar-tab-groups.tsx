import { Button } from "@/components/ui/button";
import { SidebarMenuButton, useSidebar } from "@/components/ui/resizable-sidebar";
import { cn, craftActiveFaviconURL } from "@/lib/utils";
import { XIcon, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TabGroup } from "@/components/providers/tabs-provider";
import {
  draggable,
  dropTargetForElements,
  ElementDropTargetEventBasePayload
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge, Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { TabData } from "~/types/tabs";
import { DropIndicator } from "@/components/browser-ui/sidebar/content/space-sidebar";

const MotionSidebarMenuButton = motion(SidebarMenuButton);

export function SidebarTab({ tab, isFocused }: { tab: TabData; isFocused: boolean }) {
  const [cachedFaviconUrl, setCachedFaviconUrl] = useState<string | null>(tab.faviconURL);
  const [isError, setIsError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const noFavicon = !cachedFaviconUrl || isError;

  const isMuted = tab.muted;
  const isPlayingAudio = tab.audible;

  const { open } = useSidebar();

  useEffect(() => {
    if (tab.faviconURL) {
      setCachedFaviconUrl(tab.faviconURL);
    } else {
      setCachedFaviconUrl(null);
    }
    // Reset error state when favicon url changes
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
    // Left mouse button
    if (e.button === 0) {
      handleClick();
    }
    // Middle mouse button
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
    <MotionSidebarMenuButton
      key={tab.id}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "bg-transparent active:bg-transparent",
        !isFocused && "hover:bg-black/5 hover:dark:bg-white/10",
        !isFocused && "active:bg-black/10 active:dark:bg-white/20",
        isFocused && "bg-white dark:bg-white/25",
        isFocused && "active:bg-white active:dark:bg-white/25",
        "text-gray-900 dark:text-gray-200",
        "transition-colors",
        tab.asleep && "grayscale"
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: tab.asleep ? 0.5 : 1,
        x: 0,
        scale: isPressed ? 0.985 : 1
      }}
      exit={{ opacity: 0, x: -10 }}
      onMouseDown={handleMouseDown}
      onMouseUp={() => setIsPressed(false)}
      transition={{
        duration: 0.2,
        scale: { type: "spring", stiffness: 600, damping: 20 }
      }}
      layout
    >
      <div className="flex flex-row justify-between w-full h-full">
        {/* Normal layout */}
        <>
          {/* Left side */}
          <div className={cn("flex flex-row items-center flex-1", open && "min-w-0 mr-1")}>
            {/* Favicon */}
            <div className="w-4 h-4 flex-shrink-0 mr-1">
              {!noFavicon && (
                <img
                  src={craftActiveFaviconURL(tab.id, tab.faviconURL)}
                  //src={tab.faviconURL || undefined}
                  alt={tab.title}
                  className="size-full rounded-sm user-drag-none object-contain overflow-hidden"
                  onError={() => setIsError(true)}
                  onClick={handleClick}
                  onMouseDown={handleMouseDown}
                />
              )}
              {noFavicon && <div className="size-full bg-gray-300 dark:bg-gray-300/30 rounded-sm" />}
            </div>
            {/* Audio indicator */}
            <AnimatePresence initial={false}>
              {(isPlayingAudio || isMuted) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: "auto" }}
                  exit={{ opacity: 0, scale: 0.8, width: 0, marginLeft: 0, marginRight: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center overflow-hidden ml-0.5"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleMute}
                    className="size-5 bg-transparent rounded-sm hover:bg-black/10 dark:hover:bg-white/10"
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <VolumeIcon className={cn("size-4", "text-muted-foreground/60 dark:text-white/50")} />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Title */}
            <span className="ml-1 truncate min-w-0 flex-1 font-medium">{tab.title}</span>
          </div>
          {/* Right side */}
          <div className={cn("flex flex-row items-center gap-0.5", open && "flex-shrink-0")}>
            {/* Close tab button */}
            {isHovered && (
              <motion.div whileTap={{ scale: 0.95 }} className="flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseTab}
                  className="size-5 bg-transparent rounded-sm hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <XIcon className="size-4 text-muted-foreground dark:text-white" />
                </Button>
              </motion.div>
            )}
          </div>
        </>
      </div>
    </MotionSidebarMenuButton>
  );
}

export type TabGroupSourceData = {
  type: "tab-group";
  tabGroupId: number;
  primaryTabId: number;
  profileId: string;
  spaceId: string;
  position: number;
};

export function SidebarTabGroups({
  tabGroup,
  isFocused,
  isSpaceLight,
  position,
  moveTab
}: {
  tabGroup: TabGroup;
  isActive: boolean; // isActive might still be needed depending on parent component logic
  isFocused: boolean;
  isSpaceLight: boolean;
  position: number;
  moveTab: (tabId: number, newPosition: number) => void;
}) {
  const { tabs, focusedTab } = tabGroup;
  const ref = useRef<HTMLDivElement>(null);

  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return () => {};

    function onChange({ self }: ElementDropTargetEventBasePayload) {
      const closestEdge = extractClosestEdge(self.data);
      setClosestEdge(closestEdge);
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

      if (sourceData.spaceId != tabGroup.spaceId) {
        if (sourceData.profileId != tabGroup.profileId) {
          // TODO: @MOVE_TABS_BETWEEN_PROFILES not supported yet
        } else {
          // move tab to new space
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
        // this will 'attach' the closest edge to your `data` object
        return attachClosestEdge(
          {},
          {
            input,
            element,
            // you can specify what edges you want to allow the user to be closest to
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
          // TODO: @MOVE_TABS_BETWEEN_PROFILES not supported yet
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
      {closestEdge == "top" && <DropIndicator isSpaceLight={isSpaceLight} />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        layout
        className={cn("space-y-0.5")}
        ref={ref}
      >
        {tabs.map((tab) => (
          <SidebarTab key={tab.id} tab={tab} isFocused={isFocused && focusedTab?.id === tab.id} />
        ))}
      </motion.div>
      {closestEdge == "bottom" && <DropIndicator isSpaceLight={isSpaceLight} />}
    </>
  );
}
