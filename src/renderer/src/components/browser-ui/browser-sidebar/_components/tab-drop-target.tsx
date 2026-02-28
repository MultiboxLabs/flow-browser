import { TabGroupSourceData } from "@/components/browser-ui/browser-sidebar/_components/tab-group";
import { DropIndicator } from "@/components/browser-ui/browser-sidebar/_components/drop-indicator";
import { useEffect, useRef, useState } from "react";
import { Space } from "~/flow/interfaces/sessions/spaces";
import {
  dropTargetForElements,
  ElementDropTargetEventBasePayload
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

type TabDropTargetProps = {
  spaceData: Space;
  isSpaceLight: boolean;
  moveTab: (tabId: number, newPos: number) => void;
  biggestIndex: number;
};

export function TabDropTarget({ spaceData, isSpaceLight, moveTab, biggestIndex }: TabDropTargetProps) {
  const [showDropIndicator, setShowDropIndicator] = useState(false);
  const dropTargetRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = () => {
    flow.newTab.open();
  };

  useEffect(() => {
    const el = dropTargetRef.current;
    if (!el) return () => {};

    function onDrop(args: ElementDropTargetEventBasePayload) {
      setShowDropIndicator(false);

      const sourceData = args.source.data as TabGroupSourceData;
      const sourceTabId = sourceData.primaryTabId;

      const newPos = biggestIndex + 1;

      if (sourceData.spaceId !== spaceData.id) {
        if (sourceData.profileId !== spaceData.profileId) {
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
        const sourceData = args.source.data as TabGroupSourceData;
        if (sourceData.type !== "tab-group") {
          return false;
        }
        if (sourceData.profileId !== spaceData.profileId) {
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
  }, [spaceData.profileId, isSpaceLight, moveTab, biggestIndex, spaceData.id]);

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
