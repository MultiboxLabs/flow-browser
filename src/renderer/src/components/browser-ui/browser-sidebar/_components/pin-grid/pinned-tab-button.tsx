import { cn } from "@/lib/utils";
import { useFaviconColors } from "@/hooks/use-favicon-color";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { motion } from "motion/react";
import type { PinnedTabData } from "~/types/pinned-tabs";
import { isPinnedTabSource, isTabGroupSource } from "@/components/browser-ui/browser-sidebar/_components/drag-utils";
import { generateBorderGradient } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/pin-visual";
import "./pin.css";

// Drag source type for pinned tab reordering
export type PinnedTabSourceData = {
  type: "pinned-tab";
  pinnedTabId: string;
  position: number;
};

interface PinnedTabButtonProps {
  pinnedTab: PinnedTabData;
  profileId: string | null;
  isActive: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onContextMenu: () => void;
  onReorder: (pinnedTabId: string, newPosition: number) => void;
  onCreateFromTab: (tabId: number, position: number) => void;
  pinnedTabs: PinnedTabData[];
  /** Index of this pin in the list, used for edge-change reporting. */
  index: number;
  /** Called when the closest-edge changes during a drag over this pin. */
  onEdgeChange: (index: number, edge: "left" | "right" | null) => void;
  /** Normalized edge indicator controlled by the parent grid. */
  activeEdge?: "left" | "right";
  /** True when this pin is the first item in its grid row. */
  isFirstInRow?: boolean;
  /** True when this pin is the last item in its grid row. */
  isLastInRow?: boolean;
  /** When false, layout position changes are applied instantly (no spring animation). */
  layoutAnimationsEnabled?: boolean;
}

export function PinnedTabButton({
  pinnedTab,
  profileId,
  isActive,
  onClick,
  onDoubleClick,
  onContextMenu,
  onReorder,
  onCreateFromTab,
  pinnedTabs,
  index,
  onEdgeChange,
  activeEdge,
  isFirstInRow = false,
  isLastInRow = false,
  layoutAnimationsEnabled = true
}: PinnedTabButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const faviconUrl = pinnedTab.faviconUrl;
  const faviconColors = useFaviconColors(faviconUrl);
  const hasColors = faviconColors !== null;
  const [isDragging, setIsDragging] = useState(false);

  // Generate dynamic styles for active state based on the extracted colors
  const activeBorderStyle = useMemo(() => {
    if (!isActive) return undefined;
    if (!hasColors) return undefined;

    return {
      "--gradient-border": generateBorderGradient(faviconColors, 0.6)
    } as React.CSSProperties;
  }, [faviconColors, hasColors, isActive]);

  const activeOverlayStyle = useMemo(() => {
    if (!isActive) return undefined;
    if (!hasColors) return undefined;

    return {
      backgroundImage: generateBorderGradient(faviconColors, 0.15)
    } as React.CSSProperties;
  }, [faviconColors, hasColors, isActive]);

  // Drag-and-drop for reordering
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const dragCleanup = draggable({
      element: el,
      getInitialData: () => {
        const data: PinnedTabSourceData = {
          type: "pinned-tab",
          pinnedTabId: pinnedTab.uniqueId,
          position: pinnedTab.position
        };
        return data;
      },
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false)
    });

    const dropCleanup = dropTargetForElements({
      element: el,
      canDrop: ({ source }) => {
        const data = source.data;
        if (isPinnedTabSource(data)) return true;
        if (isTabGroupSource(data)) {
          // Only accept tabs from the same profile
          return !profileId || data.profileId === profileId;
        }
        return false;
      },
      getData: ({ input, element }) => {
        return attachClosestEdge({}, { input, element, allowedEdges: ["left", "right"] });
      },
      onDragEnter: ({ self }) => {
        onEdgeChange(index, extractClosestEdge(self.data) as "left" | "right" | null);
      },
      onDrag: ({ self }) => {
        onEdgeChange(index, extractClosestEdge(self.data) as "left" | "right" | null);
      },
      onDragLeave: () => {
        onEdgeChange(index, null);
      },
      onDrop: ({ source, self }) => {
        onEdgeChange(index, null);
        const sourceData = source.data;

        const edge = extractClosestEdge(self.data);
        if (!edge) return;

        // Calculate new position based on edge
        const targetIndex = pinnedTabs.findIndex((pt) => pt.uniqueId === pinnedTab.uniqueId);
        let newPosition: number;
        if (edge === "left") {
          newPosition = targetIndex - 0.5;
        } else {
          newPosition = targetIndex + 0.5;
        }

        if (isPinnedTabSource(sourceData)) {
          onReorder(sourceData.pinnedTabId, newPosition);
        } else if (isTabGroupSource(sourceData)) {
          onCreateFromTab(sourceData.primaryTabId, newPosition);
        }
      }
    });

    return () => {
      dragCleanup();
      dropCleanup();
    };
  }, [pinnedTab.uniqueId, pinnedTab.position, pinnedTabs, profileId, onReorder, onCreateFromTab, index, onEdgeChange]);

  // Use onClick (not onMouseDown) so the browser's native click suppression
  // after a drag prevents the handler from firing on drag-to-reorder.
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onContextMenu();
    },
    [onContextMenu]
  );

  return (
    <motion.div
      className="relative"
      layout="position"
      layoutId={`pinned-tab-${pinnedTab.uniqueId}`}
      transition={{
        layout: layoutAnimationsEnabled ? { type: "spring", stiffness: 500, damping: 35 } : { duration: 0 }
      }}
    >
      {/* Drop indicator - left */}
      {activeEdge === "left" && (
        <div
          className={cn(
            "absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-white/60",
            // On the first item in a row there is no gap to the left, so
            // render the indicator flush with the cell edge instead of
            // translating it outside (where it would be clipped).
            !isFirstInRow && "-translate-x-1"
          )}
        />
      )}
      {/* Drop indicator - right */}
      {activeEdge === "right" && (
        <div
          className={cn(
            "absolute right-0 top-1 bottom-1 w-0.5 rounded-full bg-white/60",
            !isLastInRow && "translate-x-1"
          )}
        />
      )}

      <div
        ref={ref}
        className={cn(
          "w-full h-12 rounded-xl overflow-hidden",
          "bg-black/10 hover:bg-black/15",
          "dark:bg-white/15 dark:hover:bg-white/20",
          "transition-[background-color,border-color,opacity] duration-100",
          "flex items-center justify-center",
          isActive && !hasColors && "border-2 border-white",
          isActive && hasColors && "pinned-tab-active-border",
          isDragging && "opacity-40"
        )}
        style={activeBorderStyle}
        onClick={handleClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <div className={cn("size-full", isActive && "bg-white/80 dark:bg-white/30")}>
          <div className={cn("size-full", "flex items-center justify-center")} style={activeOverlayStyle}>
            <div className="relative size-5">
              <img
                src={faviconUrl || undefined}
                className="absolute rounded-sm user-drag-none object-contain overflow-hidden"
              />
              <div className="img-container">
                <img src={faviconUrl || undefined} className="user-drag-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
