import "../pin.css";

import { cn } from "@/lib/utils";
import { useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { useMeasure } from "react-use";
import { PinnedTabButton } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button";
import { SidebarScrollArea } from "@/components/browser-ui/browser-sidebar/_components/sidebar-scroll-area";
import { usePinnedTabs } from "@/components/providers/pinned-tabs-provider";
import { useFocusedTabId } from "@/components/providers/tabs-provider";
import { usePinGridColumns } from "./use-pin-grid-columns";
import { usePinGridLayoutAnimations } from "./use-pin-grid-layout-animations";
import { useEmptyStateDismiss } from "./use-empty-state-dismiss";
import { usePinGridDropTarget } from "./use-pin-grid-drop-target";
import { PinGridEmptyState } from "./empty-state";

interface PinGridProps {
  profileId: string;
}

export function PinGrid({ profileId }: PinGridProps) {
  const [measureRef, { width }] = useMeasure<HTMLDivElement>();
  const { getPinnedTabs, createFromTab, click, doubleClick, reorder, showContextMenu } = usePinnedTabs();
  const focusedTabId = useFocusedTabId();

  const pinnedTabs = useMemo(() => getPinnedTabs(profileId), [profileId, getPinnedTabs]);
  const pinCount = pinnedTabs.length;

  // --- Hooks ---
  const { cols, colsRef, gridColumnClass } = usePinGridColumns(width, pinCount);
  const { layoutAnimationsEnabled, enableAnimationsTemporarily } = usePinGridLayoutAnimations();
  const { isDismissed, dismiss } = useEmptyStateDismiss(profileId);

  // Wrap reorder/createFromTab to enable animations before the optimistic update.
  // flushSync forces React to commit the animation-enable render to the DOM
  // synchronously, so that motion/react snapshots positions with the spring
  // transition config. requestAnimationFrame then delays the position change
  // to the next frame, ensuring motion has a full render cycle between the
  // transition change and the position change.
  const handleReorder = useCallback(
    (pinnedTabId: string, newPosition: number) => {
      flushSync(() => enableAnimationsTemporarily());
      requestAnimationFrame(() => {
        reorder(pinnedTabId, newPosition);
      });
    },
    [reorder, enableAnimationsTemporarily]
  );

  const handleCreateFromTab = useCallback(
    (tabId: number, position?: number) => {
      flushSync(() => enableAnimationsTemporarily());
      requestAnimationFrame(() => {
        createFromTab(tabId, position);
      });
    },
    [createFromTab, enableAnimationsTemporarily]
  );

  const { isDragOver, activeIndicator, handleChildEdgeChange, setGridRefs } = usePinGridDropTarget({
    profileId,
    colsRef,
    measureRef,
    handleCreateFromTab,
    handleReorder
  });

  const showingEmptyState = pinCount === 0;

  return (
    <SidebarScrollArea className={cn("max-h-40", !(showingEmptyState && isDismissed) && "mb-1")}>
      <div
        ref={setGridRefs}
        className={cn(
          "grid gap-2 transition-colors duration-150",
          gridColumnClass,
          isDragOver && pinCount > 0 && "rounded-xl bg-white/10 dark:bg-white/5"
        )}
      >
        {showingEmptyState ? (
          <PinGridEmptyState isDragOver={isDragOver} hidden={isDismissed} onDismiss={dismiss} />
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
              onReorder={handleReorder}
              onCreateFromTab={handleCreateFromTab}
              pinnedTabs={pinnedTabs}
              index={index}
              onEdgeChange={handleChildEdgeChange}
              activeEdge={activeIndicator?.index === index ? activeIndicator.edge : undefined}
              isFirstInRow={index % cols === 0}
              isLastInRow={index % cols === cols - 1 || index === pinCount - 1}
              layoutAnimationsEnabled={layoutAnimationsEnabled}
            />
          ))
        )}
      </div>
    </SidebarScrollArea>
  );
}
