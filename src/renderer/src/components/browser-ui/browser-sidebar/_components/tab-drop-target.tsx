import { TabGroupSourceData } from "@/components/browser-ui/browser-sidebar/_components/tab-group";
import { DropIndicator } from "@/components/browser-ui/browser-sidebar/_components/drop-indicator";
import { useEffect, useRef, useState } from "react";
import { Space } from "~/flow/interfaces/sessions/spaces";
import {
  dropTargetForElements,
  ElementDropTargetEventBasePayload
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  dropTargetForExternal,
  ExternalDropTargetEventBasePayload
} from "@atlaskit/pragmatic-drag-and-drop/external/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { TAB_GROUP_MIME_TYPE, TAB_GROUP_PROFILE_MIME_PREFIX } from "@/lib/tab-drag-mime";

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

    function handleDrop(sourceData: TabGroupSourceData, isExternal: boolean) {
      setShowDropIndicator(false);

      const sourceTabId = sourceData.primaryTabId;
      const newPos = biggestIndex + 1;

      if (sourceData.spaceId !== spaceData.id || isExternal) {
        if (sourceData.profileId !== spaceData.profileId) {
          // TODO: @MOVE_TABS_BETWEEN_PROFILES not supported yet
        } else {
          flow.tabs.moveTabToWindowSpace(sourceTabId, spaceData.id, newPos);
        }
      } else {
        moveTab(sourceTabId, newPos);
      }
    }

    function onDrop(args: ElementDropTargetEventBasePayload) {
      const sourceData = args.source.data as TabGroupSourceData;
      handleDrop(sourceData, false);
    }

    function onExternalDrop(args: ExternalDropTargetEventBasePayload) {
      setShowDropIndicator(false);

      const raw = args.source.getStringData(TAB_GROUP_MIME_TYPE);
      if (!raw) return;

      try {
        const sourceData = JSON.parse(raw) as TabGroupSourceData;
        handleDrop(sourceData, true);
      } catch {
        // Invalid data from external source
      }
    }

    function onChange() {
      setShowDropIndicator(true);
    }

    return combine(
      dropTargetForElements({
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
      }),

      dropTargetForExternal({
        element: el,
        canDrop: (args) => {
          return args.source.types.includes(TAB_GROUP_PROFILE_MIME_PREFIX + spaceData.profileId);
        },
        onDrop: onExternalDrop,
        onDragEnter: onChange,
        onDrag: onChange,
        onDragLeave: () => setShowDropIndicator(false)
      })
    );
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
