import { useCallback, useEffect, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isPinnedTabSource, isTabGroupSource } from "@/components/browser-ui/browser-sidebar/_components/drag-utils";
import { findClosestPinEdge, type GridIndicator } from "./find-closest-pin-edge";

interface UsePinGridDropTargetOptions {
  profileId: string;
  colsRef: React.RefObject<number>;
  /** Measure ref from `useMeasure` — will be merged with the drop ref. */
  measureRef: (el: HTMLDivElement) => void;
  handleCreateFromTab: (tabId: number, position?: number) => void;
  handleReorder: (pinnedTabId: string, newPosition: number) => void;
}

/**
 * Manages all drag-and-drop state and behaviour for the pin grid:
 * - drop target registration (accepts pinned-tab reorders & tab-group creates)
 * - grid-level indicator (cursor in the gap between pins)
 * - child-level indicator (cursor directly over a PinnedTabButton)
 * - unified `activeIndicator` (child takes priority)
 * - merged ref setter for the grid element (measure + drop)
 */
export function usePinGridDropTarget({
  profileId,
  colsRef,
  measureRef,
  handleCreateFromTab,
  handleReorder
}: UsePinGridDropTargetOptions) {
  const gridDropRef = useRef<HTMLDivElement>(null);

  // --- State ---
  const [isDragOver, setIsDragOver] = useState(false);

  // Grid-level indicator (cursor is in the gap, not directly over a pin)
  const [gridIndicator, setGridIndicator] = useState<GridIndicator | null>(null);
  const gridIndicatorRef = useRef<GridIndicator | null>(null);

  // Child-level indicator (cursor is directly over a PinnedTabButton)
  const [childIndicator, setChildIndicator] = useState<GridIndicator | null>(null);

  // Unified: child takes priority over grid
  const activeIndicator = childIndicator ?? gridIndicator;

  // --- Callbacks ---

  /** Called by child PinnedTabButtons to report their closest edge. */
  const handleChildEdgeChange = useCallback(
    (index: number, edge: "left" | "right" | null) => {
      if (edge === null) {
        setChildIndicator(null);
        return;
      }
      let indicator: GridIndicator = { index, edge };
      // Normalize: "left of pin[i]" → "right of pin[i-1]" (same gap),
      // but only within the same row — across rows these are distinct positions.
      if (indicator.edge === "left" && indicator.index > 0 && indicator.index % colsRef.current !== 0) {
        indicator = { index: indicator.index - 1, edge: "right" };
      }
      setChildIndicator(indicator);
    },
    [colsRef]
  );

  /** Merge the useMeasure ref and the drop ref onto the same element. */
  const setGridRefs = useCallback(
    (el: HTMLDivElement | null) => {
      measureRef(el as HTMLDivElement);
      (gridDropRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    },
    [measureRef]
  );

  // --- Drop target effect ---
  useEffect(() => {
    const el = gridDropRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      canDrop: ({ source }) => {
        const data = source.data;
        if (isPinnedTabSource(data)) return true;
        if (isTabGroupSource(data)) {
          if (profileId && data.profileId !== profileId) return false;
          return true;
        }
        return false;
      },
      onDragEnter: ({ location, source }) => {
        if (isTabGroupSource(source.data)) {
          setIsDragOver(true);
        }
        const { input, dropTargets } = location.current;
        if (dropTargets.length === 1) {
          const indicator = findClosestPinEdge(el, input.clientX, input.clientY, colsRef.current);
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
          const indicator = findClosestPinEdge(el, input.clientX, input.clientY, colsRef.current);
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
            handleCreateFromTab(data.primaryTabId, position);
          } else {
            handleCreateFromTab(data.primaryTabId);
          }
        } else if (isPinnedTabSource(data)) {
          if (indicator) {
            const position = indicator.edge === "left" ? indicator.index - 0.5 : indicator.index + 0.5;
            handleReorder(data.pinnedTabId, position);
          }
        }
      }
    });
  }, [profileId, colsRef, handleCreateFromTab, handleReorder]);

  return { isDragOver, activeIndicator, handleChildEdgeChange, setGridRefs } as const;
}
