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
      className={cn(
        "bg-transparent active:bg-transparent",
        !isFocused && "hover:bg-black/5 hover:dark:bg-white/10",
        !isFocused && "active:bg-black/10 active:dark:bg-white/20",
        isFocused && "bg-white dark:bg-white/25",
        isFocused && "active:bg-white active:dark:bg-white/25",
        "text-gray-900 dark:text-gray-200",
        "transition-colors"
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: 1,
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
                  className="size-full rounded-sm"
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
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseTab}
                className="size-5 bg-transparent rounded-sm hover:bg-black/10 dark:hover:bg-white/10"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <XIcon className="size-4 text-muted-foreground dark:text-white" />
              </Button>
            </motion.div>
          </div>
        </>
      </div>
    </MotionSidebarMenuButton>
  );
}

export function SidebarTabGroups({
  tabGroup,
  isFocused,
  isSpaceLight
}: {
  tabGroup: TabGroup;
  isActive: boolean; // isActive might still be needed depending on parent component logic
  isFocused: boolean;
  isSpaceLight: boolean;
}) {
  const { tabs, focusedTab } = tabGroup;
  const ref = useRef<HTMLDivElement>(null);

  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return () => {};

    function onChange({ source, self }: ElementDropTargetEventBasePayload) {
      console.log("onChange", source.element);
      const closestEdge = extractClosestEdge(self.data);

      // const sourceIndex = source.data.index;

      // const isItemBeforeSource = index === sourceIndex - 1;
      // const isItemAfterSource = index === sourceIndex + 1;

      // const isDropIndicatorHidden =
      //   (isItemBeforeSource && closestEdge === "bottom") || (isItemAfterSource && closestEdge === "top");

      const isDropIndicatorHidden = false;
      if (isDropIndicatorHidden) {
        setClosestEdge(null);
        return;
      }

      setClosestEdge(closestEdge);
    }

    const draggableCleanup = draggable({
      element: el,
      getInitialData: () => {
        return {
          tabGroupId: tabGroup.id
        };
      }
    });

    const cleanupDropTarget = dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        // your base data you want to attach to the drop target
        const data = {
          tabGroupId: tabGroup.id
        };
        // this will 'attach' the closest edge to your `data` object
        return attachClosestEdge(data, {
          input,
          element,
          // you can specify what edges you want to allow the user to be closest to
          allowedEdges: ["top", "bottom"]
        });
      },
      onDrop: (args) => {
        const closestEdgeOfTarget: Edge | null = extractClosestEdge(args.self.data);
        console.log("closestEdgeOfTarget", closestEdgeOfTarget);
        setClosestEdge(null);
      },
      onDragEnter: onChange,
      onDrag: onChange,
      onDragLeave: () => setClosestEdge(null)
    });

    return () => {
      draggableCleanup();
      cleanupDropTarget();
    };
  }, [tabGroup.id]);

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
