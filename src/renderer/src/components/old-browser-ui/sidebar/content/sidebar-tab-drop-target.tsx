import { TabGroupSourceData } from "@/components/old-browser-ui/sidebar/content/sidebar-tab-groups";
import { DropIndicator } from "@/components/old-browser-ui/sidebar/content/space-sidebar";
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

// MIME type for cross-window tab drag data
const TAB_GROUP_MIME_TYPE = "application/x-flow-tab-group";

type SidebarTabDropTargetProps = {
  spaceData: Space;
  isSpaceLight: boolean;
  moveTab: (tabId: number, newPos: number) => void;
  biggestIndex: number;
};

export function SidebarTabDropTarget({ spaceData, isSpaceLight, moveTab, biggestIndex }: SidebarTabDropTargetProps) {
  const [showDropIndicator, setShowDropIndicator] = useState(false);
  const dropTargetRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = () => {
    flow.newTab.open();
  };

  useEffect(() => {
    const el = dropTargetRef.current;
    if (!el) return () => {};

    function handleDrop(sourceData: TabGroupSourceData) {
      setShowDropIndicator(false);

      const sourceTabId = sourceData.primaryTabId;
      const newPos = biggestIndex + 1;

      if (sourceData.spaceId !== spaceData.id) {
        if (sourceData.profileId !== spaceData.profileId) {
          // TODO: @MOVE_TABS_BETWEEN_PROFILES not supported yet
        } else {
          // move tab to new space
          flow.tabs.moveTabToWindowSpace(sourceTabId, spaceData.id, newPos);
        }
      } else {
        moveTab(sourceTabId, newPos);
      }
    }

    function onDrop(args: ElementDropTargetEventBasePayload) {
      const sourceData = args.source.data as TabGroupSourceData;
      handleDrop(sourceData);
    }

    function onExternalDrop(args: ExternalDropTargetEventBasePayload) {
      setShowDropIndicator(false);

      const raw = args.source.getStringData(TAB_GROUP_MIME_TYPE);
      if (!raw) return;

      try {
        const sourceData = JSON.parse(raw) as TabGroupSourceData;
        handleDrop(sourceData);
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
          return args.source.types.includes(TAB_GROUP_MIME_TYPE);
        },
        onDrop: onExternalDrop,
        onDragEnter: onChange,
        onDrag: onChange,
        onDragLeave: () => setShowDropIndicator(false)
      })
    );
  }, [spaceData.profileId, isSpaceLight, moveTab, biggestIndex, spaceData.id]);

  return (
    <>
      {showDropIndicator && <DropIndicator isSpaceLight={isSpaceLight} />}
      <div className="flex-1 flex flex-col" ref={dropTargetRef} onDoubleClick={handleDoubleClick}></div>
    </>
  );
}
