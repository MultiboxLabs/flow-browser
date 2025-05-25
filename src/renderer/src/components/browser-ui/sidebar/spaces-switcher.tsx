import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/resizable-sidebar";
import { Space } from "~/flow/interfaces/sessions/spaces";
import { cn } from "@/lib/utils";
import { useSpaces } from "@/components/providers/spaces-provider";
import { SIDEBAR_HOVER_COLOR, SIDEBAR_HOVER_COLOR_PLAIN } from "@/components/browser-ui/browser-sidebar";
import { SpaceIcon } from "@/lib/phosphor-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TabGroupSourceData } from "@/components/browser-ui/sidebar/content/sidebar-tab-groups";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

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
          console.log("clicked");
          onClickRef.current();
          removeDraggingTimeout();
        }, 100);
      }
    }

    function stopDragging() {
      setDragging(false);
      removeDraggingTimeout();
    }

    return dropTargetForElements({
      element,
      canDrop: (args) => {
        const sourceData = args.source.data as TabGroupSourceData;
        if (sourceData.type !== "tab-group") return false;

        const sourceProfileId = sourceData.profileId;
        const targetProfileId = space.profileId;

        // TODO: @MOVE_TABS_BETWEEN_PROFILES Does not support moving tabs between profiles
        if (sourceProfileId !== targetProfileId) return false;

        return true;
      },
      onDragEnter: startDragging,
      onDrag: startDragging,
      onDragLeave: stopDragging,
      onDrop: stopDragging
    });
  }, [onClick, removeDraggingTimeout, space.profileId]);

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
