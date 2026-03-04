import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/resizable-sidebar";
import { Space } from "~/flow/interfaces/sessions/spaces";
import { cn } from "@/lib/utils";
import { useSpaces } from "@/components/providers/spaces-provider";
import { SIDEBAR_HOVER_COLOR, SIDEBAR_HOVER_COLOR_PLAIN } from "@/components/old-browser-ui/browser-sidebar";
import { SpaceIcon } from "@/lib/phosphor-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TabGroupSourceData } from "@/components/old-browser-ui/sidebar/content/sidebar-tab-groups";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForExternal } from "@atlaskit/pragmatic-drag-and-drop/external/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { TAB_GROUP_MIME_TYPE, TAB_GROUP_PROFILE_MIME_PREFIX } from "@/lib/tab-drag-mime";

type SpaceButtonProps = {
  space: Space;
  isActive: boolean;
};

function SpaceButton({ space, isActive }: SpaceButtonProps) {
  const { setCurrentSpace } = useSpaces();

  const ref = useRef<HTMLButtonElement>(null);

  const [dragging, setDragging] = useState(false);

  const draggingRef = useRef(false);
  draggingRef.current = dragging;

  const draggingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onClick = useCallback(() => {
    setCurrentSpace(space.id);
  }, [setCurrentSpace, space.id]);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const removeDraggingTimeout = useCallback(() => {
    if (draggingTimeoutRef.current) {
      clearTimeout(draggingTimeoutRef.current);
      draggingTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function startDragging() {
      if (draggingRef.current) return;
      setDragging(true);

      if (!draggingTimeoutRef.current) {
        draggingTimeoutRef.current = setTimeout(() => {
          onClickRef.current();
          removeDraggingTimeout();
        }, 100);
      }
    }

    function stopDragging() {
      setDragging(false);
      removeDraggingTimeout();
    }

    function handleDrop(sourceData: TabGroupSourceData, isExternal: boolean) {
      stopDragging();

      // Validate profile compatibility
      if (sourceData.profileId !== space.profileId) {
        // TODO: @MOVE_TABS_BETWEEN_PROFILES not supported yet
        return;
      }

      // For external (cross-window) drops, always move via IPC even if same space
      if (!isExternal && sourceData.spaceId === space.id) {
        return;
      }

      // Move the tab to this space (no specific position — append to end)
      const sourceTabId = sourceData.primaryTabId;
      flow.tabs.moveTabToWindowSpace(sourceTabId, space.id, undefined, sourceData.dragToken);
    }

    return combine(
      dropTargetForElements({
        element,
        canDrop: (args) => {
          const sourceData = args.source.data as TabGroupSourceData;
          if (sourceData.type !== "tab-group") return false;

          // Does not support moving tabs between profiles
          if (sourceData.profileId !== space.profileId) return false;

          // Don't allow dropping on the space the tab is already in
          if (sourceData.spaceId === space.id) return false;

          return true;
        },
        onDragEnter: startDragging,
        onDrag: startDragging,
        onDragLeave: stopDragging,
        onDrop: (args) => {
          const sourceData = args.source.data as TabGroupSourceData;
          handleDrop(sourceData, false);
        }
      }),

      dropTargetForExternal({
        element,
        canDrop: (args) => {
          // Profile-specific MIME type lets us check compatibility during drag
          return args.source.types.includes(TAB_GROUP_PROFILE_MIME_PREFIX + space.profileId);
        },
        onDragEnter: startDragging,
        onDrag: startDragging,
        onDragLeave: stopDragging,
        onDrop: (args) => {
          stopDragging();

          const raw = args.source.getStringData(TAB_GROUP_MIME_TYPE);
          if (!raw) return;

          try {
            const sourceData = JSON.parse(raw) as TabGroupSourceData;
            if (!sourceData.dragToken) return;
            handleDrop(sourceData, true);
          } catch {
            // Invalid data from external source
          }
        }
      })
    );
  }, [onClick, removeDraggingTimeout, space.profileId, space.id]);

  return (
    <SidebarMenuButton
      key={space.id}
      onClick={onClick}
      className={cn(SIDEBAR_HOVER_COLOR, dragging && SIDEBAR_HOVER_COLOR_PLAIN)}
      ref={ref}
    >
      <SpaceIcon
        id={space.icon}
        strokeWidth={2.5}
        className={cn(
          "transition-colors duration-300",
          "text-black/40 dark:text-white/40",
          isActive && "text-black dark:text-white"
        )}
      />
    </SidebarMenuButton>
  );
}

export function SidebarSpacesSwitcher() {
  const { spaces, currentSpace } = useSpaces();

  return (
    <SidebarMenuItem className={cn("flex flex-row gap-0.5")}>
      {spaces.map((space) => (
        <SpaceButton key={space.id} space={space} isActive={currentSpace?.id === space.id} />
      ))}
    </SidebarMenuItem>
  );
}
