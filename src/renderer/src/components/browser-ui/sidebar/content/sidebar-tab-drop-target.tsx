import { TabGroupSourceData } from "@/components/browser-ui/sidebar/content/sidebar-tab-groups";
import { DropIndicator } from "@/components/browser-ui/sidebar/content/space-sidebar";
import { useEffect, useRef, useState } from "react";
import { Space } from "~/flow/interfaces/sessions/spaces";
import {
  dropTargetForElements,
  ElementDropTargetEventBasePayload
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

type SidebarTabDropTargetProps = {
  spaceData: Space;
  isSpaceLight: boolean;
  moveTab: (tabId: number, newPos: number) => void;
  biggestIndex: number;
};

export function SidebarTabDropTarget({ spaceData, isSpaceLight, moveTab, biggestIndex }: SidebarTabDropTargetProps) {
  const [showDropIndicator, setShowDropIndicator] = useState(false);
  const dropTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dropTargetRef.current;
    if (!el) return () => {};

    function onDrop(args: ElementDropTargetEventBasePayload) {
      setShowDropIndicator(false);

      const sourceData = args.source.data as TabGroupSourceData;
      const sourceTabId = sourceData.primaryTabId;

      const newPos = biggestIndex + 1;

      if (sourceData.spaceId != spaceData.id) {
        if (sourceData.profileId != spaceData.profileId) {
          // TODO: @MOVE_TABS_BETWEEN_PROFILES not supported yet
        } else {
          // move tab to new space
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
    <>
      {showDropIndicator && <DropIndicator isSpaceLight={isSpaceLight} />}
      <div className="flex-1 flex flex-col" ref={dropTargetRef}></div>
    </>
  );
}
