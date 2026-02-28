import { cn } from "@/lib/utils";
import { useFaviconColors, FaviconColors, RGB } from "@/hooks/use-favicon-color";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { PinnedTabData } from "~/types/pinned-tabs";
import "./pin.css";

/**
 * Convert RGB to rgba string
 */
function rgba(color: RGB | null, opacity: number): string {
  if (!color) return `rgba(255, 255, 255, ${opacity})`;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
}

/**
 * Generate a border gradient using corner colors
 */
function generateBorderGradient(colors: FaviconColors, opacity: number): string {
  // Create a conic gradient using the corner colors
  const tl = rgba(colors.topLeft, opacity);
  const tr = rgba(colors.topRight, opacity);
  const br = rgba(colors.bottomRight, opacity);
  const bl = rgba(colors.bottomLeft, opacity);

  // Conic gradient starting from top-left, going clockwise
  return `conic-gradient(from 45deg, ${tr} 0deg, ${br} 90deg, ${bl} 180deg, ${tl} 270deg, ${tr} 360deg)`;
}

// Drag source type for pinned tab reordering
export type PinnedTabSourceData = {
  type: "pinned-tab";
  pinnedTabId: string;
  position: number;
};

function isPinnedTabSource(data: Record<string, unknown>): data is PinnedTabSourceData {
  return data.type === "pinned-tab" && typeof data.pinnedTabId === "string";
}

interface PinnedTabButtonProps {
  pinnedTab: PinnedTabData;
  isActive: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onContextMenu: () => void;
  onReorder: (pinnedTabId: string, newPosition: number) => void;
  pinnedTabs: PinnedTabData[];
}

export function PinnedTabButton({
  pinnedTab,
  isActive,
  onClick,
  onDoubleClick,
  onContextMenu,
  onReorder,
  pinnedTabs
}: PinnedTabButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const faviconUrl = pinnedTab.faviconUrl;
  const faviconColors = useFaviconColors(faviconUrl);
  const hasColors = faviconColors !== null;
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
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
      canDrop: ({ source }) => isPinnedTabSource(source.data),
      getData: ({ input, element }) => {
        return attachClosestEdge({}, { input, element, allowedEdges: ["left", "right"] });
      },
      onDragEnter: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
      onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
      onDragLeave: () => setClosestEdge(null),
      onDrop: ({ source, self }) => {
        setClosestEdge(null);
        const sourceData = source.data;
        if (!isPinnedTabSource(sourceData)) return;

        const edge = extractClosestEdge(self.data);
        if (!edge) return;

        // Calculate new position
        const targetIndex = pinnedTabs.findIndex((pt) => pt.uniqueId === pinnedTab.uniqueId);
        let newPosition: number;
        if (edge === "left") {
          newPosition = targetIndex > 0 ? targetIndex - 0.5 : 0;
        } else {
          newPosition = targetIndex + 0.5;
        }

        onReorder(sourceData.pinnedTabId, newPosition);
      }
    });

    return () => {
      dragCleanup();
      dropCleanup();
    };
  }, [pinnedTab.uniqueId, pinnedTab.position, pinnedTabs, onReorder]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onContextMenu();
    },
    [onContextMenu]
  );

  return (
    <div className="relative">
      {/* Drop indicator - left */}
      {closestEdge === "left" && (
        <div className="absolute left-0 top-1 bottom-1 w-0.5 -translate-x-1 rounded-full bg-white/60" />
      )}
      {/* Drop indicator - right */}
      {closestEdge === "right" && (
        <div className="absolute right-0 top-1 bottom-1 w-0.5 translate-x-1 rounded-full bg-white/60" />
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
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <div id="overlay-overlay" className={cn("size-full", isActive && "bg-white/80 dark:bg-white/30")}>
          <div id="overlay" className={cn("size-full", "flex items-center justify-center")} style={activeOverlayStyle}>
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
    </div>
  );
}
