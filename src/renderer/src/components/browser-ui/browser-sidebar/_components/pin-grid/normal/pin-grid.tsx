import "../pin.css";

import { cn } from "@/lib/utils";
import { useMeasure } from "react-use";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PinnedTabButton } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button";
import { SidebarScrollArea } from "@/components/browser-ui/browser-sidebar/_components/sidebar-scroll-area";
import { usePinnedTabs } from "@/components/providers/pinned-tabs-provider";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useFocusedTabId } from "@/components/providers/tabs-provider";
import { isPinnedTabSource, isTabGroupSource } from "@/components/browser-ui/browser-sidebar/_components/drag-utils";

type GridIndicator = { index: number; edge: "left" | "right" };

/**
 * Find the closest pin edge (left or right) to the cursor position.
 * Uses Euclidean distance from cursor to each pin's edge midpoints,
 * which naturally handles multi-row grid layouts.
 */
function findClosestPinEdge(gridEl: HTMLElement, clientX: number, clientY: number): GridIndicator | null {
  const children = gridEl.children;
  if (children.length === 0) return null;

  let closestDist = Infinity;
  let result: GridIndicator | null = null;

  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    const dLeft = Math.hypot(clientX - rect.left, clientY - midY);
    if (dLeft < closestDist) {
      closestDist = dLeft;
      result = { index: i, edge: "left" };
    }

    const dRight = Math.hypot(clientX - rect.right, clientY - midY);
    if (dRight < closestDist) {
      closestDist = dRight;
      result = { index: i, edge: "right" };
    }
  }

  // Normalize: "left of pin i" and "right of pin i-1" are the same gap.
  // Always express it as "right of the earlier pin" so the indicator doesn't
  // jump between two physical positions when the cursor wiggles.
  if (result && result.edge === "left" && result.index > 0) {
    result = { index: result.index - 1, edge: "right" };
  }

  return result;
}

interface PinGridProps {
  profileId: string;
}

export function PinGrid({ profileId }: PinGridProps) {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const gridDropRef = useRef<HTMLDivElement>(null);
  const { getPinnedTabs, createFromTab, click, doubleClick, reorder, showContextMenu } = usePinnedTabs();
  const focusedTabId = useFocusedTabId();

  const pinnedTabs = useMemo(() => {
    return getPinnedTabs(profileId);
  }, [profileId, getPinnedTabs]);

  const amountOfPinnedTabs = pinnedTabs.length;

  // Drop target: accept tab drags to create pinned tabs
  // The drop ref is on the grid div (inside SidebarScrollArea) rather than
  // wrapping SidebarScrollArea, so that SidebarScrollArea remains a direct
  // flex/block child with proper height resolution for its Viewport.
  const [isDragOver, setIsDragOver] = useState(false);
  // Tracks the closest pin edge when cursor is over the grid but not over a
  // specific PinnedTabButton.  The ref mirrors the state so the onDrop handler
  // (which captures a stale closure) always reads the latest value.
  const [gridIndicator, setGridIndicator] = useState<GridIndicator | null>(null);
  const gridIndicatorRef = useRef<GridIndicator | null>(null);

  // Tracks the closest pin edge reported by a child PinnedTabButton (when the
  // cursor IS directly over a pin).  Normalized so that equivalent gaps always
  // resolve to the same indicator position.
  const [childIndicator, setChildIndicator] = useState<GridIndicator | null>(null);

  // Callback for child PinnedTabButtons to report their closest edge.
  const handleChildEdgeChange = useCallback((index: number, edge: "left" | "right" | null) => {
    if (edge === null) {
      setChildIndicator(null);
      return;
    }
    let indicator: GridIndicator = { index, edge };
    // Normalize: "left of pin[i]" → "right of pin[i-1]" (same gap).
    if (indicator.edge === "left" && indicator.index > 0) {
      indicator = { index: indicator.index - 1, edge: "right" };
    }
    setChildIndicator(indicator);
  }, []);

  // Unified indicator: child (direct hover) takes priority over grid (gap hover).
  const activeIndicator = childIndicator ?? gridIndicator;

  // Combine the measure ref and the drop ref onto the same element
  const setGridRefs = useCallback(
    (el: HTMLDivElement | null) => {
      ref(el as HTMLDivElement);
      (gridDropRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    },
    [ref]
  );

  useEffect(() => {
    const el = gridDropRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      canDrop: ({ source }) => {
        const data = source.data;
        // Accept pinned tab drags (for reordering across gaps)
        if (isPinnedTabSource(data)) return true;
        // Accept tab group drags (for creating new pins)
        if (isTabGroupSource(data)) {
          // Only accept tabs from the same profile
          if (profileId && data.profileId !== profileId) return false;
          return true;
        }
        return false;
      },
      onDragEnter: ({ location, source }) => {
        // Only show the white overlay for tab-group drags (new pin creation),
        // not for pinned-tab reorders.
        if (isTabGroupSource(source.data)) {
          setIsDragOver(true);
        }
        // When the grid is the only drop target (cursor is not over a specific
        // PinnedTabButton), compute the closest pin edge for the indicator.
        const { input, dropTargets } = location.current;
        if (dropTargets.length === 1) {
          const indicator = findClosestPinEdge(el, input.clientX, input.clientY);
          gridIndicatorRef.current = indicator;
          setGridIndicator(indicator);
        } else {
          gridIndicatorRef.current = null;
          setGridIndicator(null);
        }
      },
      onDrag: ({ location }) => {
        const { input, dropTargets } = location.current;
        if (dropTargets.length === 1) {
          const indicator = findClosestPinEdge(el, input.clientX, input.clientY);
          // Only update state when the indicator actually changes to avoid
          // unnecessary re-renders (onDrag fires every frame).
          gridIndicatorRef.current = indicator;
          setGridIndicator((prev) => {
            if (prev?.index === indicator?.index && prev?.edge === indicator?.edge) return prev;
            return indicator;
          });
        } else {
          if (gridIndicatorRef.current !== null) {
            gridIndicatorRef.current = null;
            setGridIndicator(null);
          }
        }
      },
      onDragLeave: () => {
        setIsDragOver(false);
        gridIndicatorRef.current = null;
        setGridIndicator(null);
        setChildIndicator(null);
      },
      onDrop: ({ source, location }) => {
        setIsDragOver(false);
        const indicator = gridIndicatorRef.current;
        gridIndicatorRef.current = null;
        setGridIndicator(null);
        setChildIndicator(null);

        const data = source.data;

        // If the drop landed on a child PinnedTabButton (nested drop target),
        // it already handled the insertion with a specific position — skip here.
        const targets = location.current.dropTargets;
        if (targets.length > 1 && targets[0].element !== el) return;

        if (isTabGroupSource(data)) {
          if (indicator) {
            const position = indicator.edge === "left" ? indicator.index - 0.5 : indicator.index + 0.5;
            createFromTab(data.primaryTabId, position);
          } else {
            createFromTab(data.primaryTabId);
          }
        } else if (isPinnedTabSource(data)) {
          if (indicator) {
            const position = indicator.edge === "left" ? indicator.index - 0.5 : indicator.index + 0.5;
            reorder(data.pinnedTabId, position);
          }
        }
      }
    });
  }, [profileId, createFromTab, reorder]);

  // Calculate columns based on container width
  // Minimum tab width: ~60px + gap (8px) = ~68px per column
  const cols = useMemo(() => {
    if (width > 0) {
      const minTabWidth = 60;
      const gap = 8; // gap-2 = 8px
      const calculatedCols = Math.max(1, Math.floor((width + gap) / (minTabWidth + gap)));
      return calculatedCols;
    }
    // Default placeholder value
    return 3;
  }, [width]);

  const gridColumnClass = {
    "grid-cols-1": cols >= 1 && amountOfPinnedTabs >= 1,
    "grid-cols-2": cols >= 2 && amountOfPinnedTabs >= 2,
    "grid-cols-3": cols >= 3 && amountOfPinnedTabs >= 3,
    "grid-cols-4": cols >= 4 && amountOfPinnedTabs >= 4,
    "grid-cols-5": cols >= 5 && amountOfPinnedTabs >= 5
  };

  return (
    <SidebarScrollArea className="max-h-40">
      <div
        ref={setGridRefs}
        className={cn(
          "grid gap-2 transition-colors duration-150",
          gridColumnClass,
          // When dragging a tab over the pin grid that already has pins,
          // show a subtle background highlight as a visual drop hint.
          isDragOver && amountOfPinnedTabs > 0 && "rounded-xl bg-white/10 dark:bg-white/5"
        )}
      >
        {amountOfPinnedTabs === 0 ? (
          <PinGridEmptyState isDragOver={isDragOver} />
        ) : (
          pinnedTabs.map((pinnedTab, index) => (
            <PinnedTabButton
              key={pinnedTab.uniqueId}
              pinnedTab={pinnedTab}
              profileId={profileId}
              isActive={pinnedTab.associatedTabId !== null && pinnedTab.associatedTabId === focusedTabId}
              onClick={() => click(pinnedTab.uniqueId)}
              onDoubleClick={() => doubleClick(pinnedTab.uniqueId)}
              onContextMenu={() => showContextMenu(pinnedTab.uniqueId)}
              onReorder={reorder}
              onCreateFromTab={createFromTab}
              pinnedTabs={pinnedTabs}
              index={index}
              onEdgeChange={handleChildEdgeChange}
              activeEdge={activeIndicator?.index === index ? activeIndicator.edge : undefined}
            />
          ))
        )}
      </div>
    </SidebarScrollArea>
  );
}

function PinGridEmptyState({ isDragOver }: { isDragOver: boolean }) {
  return (
    <div
      className={cn(
        "col-span-full flex items-center justify-center",
        "h-12 rounded-xl",
        "border-2 border-dashed",
        "transition-colors duration-150",
        isDragOver
          ? "border-white/40 bg-white/10 dark:border-white/30 dark:bg-white/5"
          : "border-black/20 dark:border-white/20"
      )}
    >
      <span className="text-xs text-black/50 dark:text-white/50 select-none">Drag tabs here to pin</span>
    </div>
  );
}
