import { TabGroupSourceData } from "@/components/browser-ui/browser-sidebar/_components/tab-group";
import { DropIndicator } from "@/components/browser-ui/browser-sidebar/_components/drop-indicator";
import { useEffect, useRef, useState } from "react";
import { Space } from "~/flow/interfaces/sessions/spaces";
import {
  dropTargetForElements,
  ElementDropTargetEventBasePayload
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { PinnedTabSourceData } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button";
import { usePinnedTabs } from "@/components/providers/pinned-tabs-provider";

function isPinnedTabSource(data: Record<string, unknown>): data is PinnedTabSourceData {
  return data.type === "pinned-tab" && typeof data.pinnedTabId === "string";
}

type TabDropTargetProps = {
  spaceData: Space;
  isSpaceLight: boolean;
  moveTab: (tabId: number, newPos: number) => void;
  biggestIndex: number;
};

export function TabDropTarget({ spaceData, isSpaceLight, moveTab, biggestIndex }: TabDropTargetProps) {
  const [showDropIndicator, setShowDropIndicator] = useState(false);
  const dropTargetRef = useRef<HTMLDivElement>(null);
  const { unpinToTabList } = usePinnedTabs();

  const handleDoubleClick = () => {
    flow.newTab.open();
  };

  useEffect(() => {
    const el = dropTargetRef.current;
    if (!el) return () => {};

    function onDrop(args: ElementDropTargetEventBasePayload) {
      setShowDropIndicator(false);

      const sourceData = args.source.data;

      // Handle pinned tab drops — unpin and show in tab list at the end
      if (isPinnedTabSource(sourceData)) {
        unpinToTabList(sourceData.pinnedTabId, biggestIndex + 1);
        return;
      }

      const tabGroupData = sourceData as TabGroupSourceData;
      const sourceTabId = tabGroupData.primaryTabId;

      const newPos = biggestIndex + 1;

      if (tabGroupData.spaceId !== spaceData.id) {
        if (tabGroupData.profileId !== spaceData.profileId) {
          // TODO: @MOVE_TABS_BETWEEN_PROFILES not supported yet
        } else {
          flow.tabs.moveTabToWindowSpace(sourceTabId, spaceData.id, newPos);
        }
      } else {
        moveTab(sourceTabId, newPos);
      }
    }

    function onChange() {
      setShowDropIndicator(true);
    }

    const cleanupDropTarget = dropTargetForElements({
      element: el,
      canDrop: (args) => {
        const sourceData = args.source.data;

        // Accept pinned tab drags (for unpinning)
        if (isPinnedTabSource(sourceData)) {
          return true;
        }

        // Accept tab group drags (existing behavior)
        const tabGroupData = sourceData as TabGroupSourceData;
        if (tabGroupData.type !== "tab-group") {
          return false;
        }
        if (tabGroupData.profileId !== spaceData.profileId) {
          // TODO: @MOVE_TABS_BETWEEN_PROFILES not supported yet
          return false;
        }
        return true;
      },
      onDrop: onDrop,
      onDragEnter: onChange,
      onDrag: onChange,
      onDragLeave: () => setShowDropIndicator(false)
    });

    return cleanupDropTarget;
  }, [spaceData.profileId, isSpaceLight, moveTab, biggestIndex, spaceData.id, unpinToTabList]);

  return (
    <div className="relative flex-1 flex flex-col" ref={dropTargetRef} onDoubleClick={handleDoubleClick}>
      {showDropIndicator && (
        <div className="absolute top-0 left-0 right-0 -translate-y-1/2 z-elevated pointer-events-none">
          <DropIndicator isSpaceLight={isSpaceLight} />
        </div>
      )}
    </div>
  );
}
