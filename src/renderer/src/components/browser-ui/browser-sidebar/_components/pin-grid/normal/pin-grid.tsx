import "../pin.css";

import { cn } from "@/lib/utils";
import { useMeasure } from "react-use";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PinnedTabButton } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button";
import { SidebarScrollArea } from "@/components/browser-ui/browser-sidebar/_components/sidebar-scroll-area";
import { usePinnedTabs } from "@/components/providers/pinned-tabs-provider";
import { useSpaces } from "@/components/providers/spaces-provider";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { TabGroupSourceData } from "@/components/browser-ui/browser-sidebar/_components/tab-group";
import { useFocusedTabId } from "@/components/providers/tabs-provider";

function isTabGroupSource(data: Record<string, unknown>): data is TabGroupSourceData {
  return data.type === "tab-group" && typeof data.primaryTabId === "number";
}

export function PinGrid() {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const dropRef = useRef<HTMLDivElement>(null);
  const { currentSpace } = useSpaces();
  const { getPinnedTabs, createFromTab, click, doubleClick, reorder, showContextMenu } = usePinnedTabs();
  const focusedTabId = useFocusedTabId();

  const profileId = currentSpace?.profileId ?? null;
  const pinnedTabs = useMemo(() => {
    if (!profileId) return [];
    return getPinnedTabs(profileId);
  }, [profileId, getPinnedTabs]);

  const amountOfPinnedTabs = pinnedTabs.length;

  // Drop target: accept tab drags to create pinned tabs
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      canDrop: ({ source }) => {
        const data = source.data;
        if (!isTabGroupSource(data)) return false;
        // Only accept tabs from the same profile
        if (profileId && data.profileId !== profileId) return false;
        return true;
      },
      onDragEnter: () => setIsDragOver(true),
      onDragLeave: () => setIsDragOver(false),
      onDrop: ({ source }) => {
        setIsDragOver(false);
        const data = source.data;
        if (!isTabGroupSource(data)) return;
        createFromTab(data.primaryTabId);
      }
    });
  }, [profileId, createFromTab]);

  // Reorder handler
  const handleReorder = useCallback(
    (pinnedTabId: string, newPosition: number) => {
      reorder(pinnedTabId, newPosition);
    },
    [reorder]
  );

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
    <div ref={dropRef}>
      <SidebarScrollArea className="max-h-40">
        <div ref={ref} className={cn("grid gap-2", gridColumnClass)}>
          {amountOfPinnedTabs === 0 ? (
            <PinGridEmptyState isDragOver={isDragOver} />
          ) : (
            pinnedTabs.map((pinnedTab) => (
              <PinnedTabButton
                key={pinnedTab.uniqueId}
                pinnedTab={pinnedTab}
                isActive={pinnedTab.associatedTabId !== null && pinnedTab.associatedTabId === focusedTabId}
                onClick={() => click(pinnedTab.uniqueId)}
                onDoubleClick={() => doubleClick(pinnedTab.uniqueId)}
                onContextMenu={() => showContextMenu(pinnedTab.uniqueId)}
                onReorder={handleReorder}
                pinnedTabs={pinnedTabs}
              />
            ))
          )}
        </div>
      </SidebarScrollArea>
    </div>
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
          : "border-black/10 dark:border-white/10"
      )}
    >
      <span className="text-xs text-black/30 dark:text-white/30 select-none">Drag tabs here to pin</span>
    </div>
  );
}
