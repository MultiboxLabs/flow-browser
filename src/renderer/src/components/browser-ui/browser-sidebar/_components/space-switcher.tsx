import { Space } from "~/flow/interfaces/sessions/spaces";
import { cn } from "@/lib/utils";
import { useSpaces } from "@/components/providers/spaces-provider";
import { SpaceIcon } from "@/lib/phosphor-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TabGroupSourceData } from "@/components/browser-ui/browser-sidebar/_components/tab-group";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { AnimatePresence, motion } from "motion/react";

// Layout constants (px)
const ICON_SIZE = 28; // size-7
const DOT_SIZE = 20; // size-5
const GAP = 2; // gap-0.5

type SpaceButtonProps = {
  space: Space;
  isActive: boolean;
  compact: boolean;
};

function SpaceButton({ space, isActive, compact }: SpaceButtonProps) {
  const { setCurrentSpace } = useSpaces();

  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const draggingRef = useRef(false);
  draggingRef.current = dragging;

  const draggingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onClick = useCallback(() => {
    setCurrentSpace(space.id);
  }, [setCurrentSpace, space.id]);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const removeDraggingTimeout = useCallback(() => {
    if (draggingTimeoutRef.current) {
      clearTimeout(draggingTimeoutRef.current);
      draggingTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function startDragging() {
      if (draggingRef.current) return;
      setDragging(true);

      if (!draggingTimeoutRef.current) {
        draggingTimeoutRef.current = setTimeout(() => {
          onClickRef.current();
          removeDraggingTimeout();
        }, 100);
      }
    }

    function stopDragging() {
      setDragging(false);
      removeDraggingTimeout();
    }

    return dropTargetForElements({
      element,
      canDrop: (args) => {
        const sourceData = args.source.data as TabGroupSourceData;
        if (sourceData.type !== "tab-group") return false;

        const sourceProfileId = sourceData.profileId;
        const targetProfileId = space.profileId;

        // Does not support moving tabs between profiles
        if (sourceProfileId !== targetProfileId) return false;

        // Don't allow dropping on the space the tab is already in
        if (sourceData.spaceId === space.id) return false;

        return true;
      },
      onDragEnter: startDragging,
      onDrag: startDragging,
      onDragLeave: stopDragging,
      onDrop: (args) => {
        stopDragging();

        // Move the tab to this space (no specific position — append to end)
        const sourceData = args.source.data as TabGroupSourceData;
        const sourceTabId = sourceData.primaryTabId;
        flow.tabs.moveTabToWindowSpace(sourceTabId, space.id);
      }
    });
  }, [onClick, removeDraggingTimeout, space.profileId, space.id]);

  const showIcon = !compact || isHovered || isActive;

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex items-center justify-center rounded-md",
        "transition-all duration-150",
        showIcon ? "size-7" : "size-5",
        showIcon && "hover:bg-black/10 active:bg-black/15 dark:hover:bg-white/10 dark:active:bg-white/15",
        dragging && "bg-black/10 dark:bg-white/10"
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {showIcon ? (
          <motion.div
            key="icon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            <SpaceIcon
              id={space.icon}
              strokeWidth={2.5}
              className={cn(
                "size-4 transition-colors duration-300",
                "text-black/50 dark:text-white/50",
                isActive && "text-black dark:text-white"
              )}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dot"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className={cn("size-2 rounded-full transition-colors duration-300", "bg-black/25 dark:bg-white/25")}
          />
        )}
      </AnimatePresence>
    </button>
  );
}

/**
 * Compute which spaces are visible given the available width.
 * When all spaces fit as icons, returns compact=false.
 * Otherwise returns a windowed subset around the active space with compact=true.
 */
function useVisibleSpaces(spaces: Space[], activeIndex: number, containerWidth: number) {
  return useMemo<{ visibleSpaces: Space[]; compact: boolean }>(() => {
    if (spaces.length === 0 || containerWidth <= 0) {
      return { visibleSpaces: spaces, compact: false };
    }

    // Check if everything fits as full icons
    const allIconsNeeded = spaces.length * ICON_SIZE + Math.max(0, spaces.length - 1) * GAP;
    if (allIconsNeeded <= containerWidth) {
      return { visibleSpaces: spaces, compact: false };
    }

    // Compact mode: 1 active icon + surrounding dots
    const totalNeeded = ICON_SIZE + Math.max(0, spaces.length - 1) * (DOT_SIZE + GAP);
    if (totalNeeded <= containerWidth) {
      return { visibleSpaces: spaces, compact: true };
    }

    // Budget for dots after reserving space for the active icon
    const remaining = containerWidth - ICON_SIZE;
    const maxDots = Math.max(0, Math.floor(remaining / (DOT_SIZE + GAP)));

    // Distribute dots equally left and right of active
    let leftCount = Math.floor(maxDots / 2);
    let rightCount = maxDots - leftCount;

    // Clamp to actual available spaces on each side
    const availableLeft = activeIndex;
    const availableRight = spaces.length - 1 - activeIndex;

    if (leftCount > availableLeft) {
      // Redistribute excess to the right
      rightCount = Math.min(availableRight, rightCount + (leftCount - availableLeft));
      leftCount = availableLeft;
    } else if (rightCount > availableRight) {
      // Redistribute excess to the left
      leftCount = Math.min(availableLeft, leftCount + (rightCount - availableRight));
      rightCount = availableRight;
    }

    const start = activeIndex - leftCount;
    const end = activeIndex + rightCount + 1;
    return { visibleSpaces: spaces.slice(start, end), compact: true };
  }, [spaces, activeIndex, containerWidth]);
}

export function SpaceSwitcher() {
  const { spaces, currentSpace } = useSpaces();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentBoxSize[0].inlineSize);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const activeIndex = useMemo(() => {
    if (!currentSpace) return 0;
    const idx = spaces.findIndex((s) => s.id === currentSpace.id);
    return idx >= 0 ? idx : 0;
  }, [spaces, currentSpace]);

  const { visibleSpaces, compact } = useVisibleSpaces(spaces, activeIndex, containerWidth);

  return (
    <div ref={containerRef} className="flex-1 min-w-0 flex justify-center">
      <div className={cn("flex flex-row items-center", compact ? "gap-0.5" : "gap-1")}>
        {visibleSpaces.map((space) => (
          <SpaceButton key={space.id} space={space} isActive={currentSpace?.id === space.id} compact={compact} />
        ))}
      </div>
    </div>
  );
}
