import { SidebarContent } from "@/components/ui/resizable-sidebar";
import { useMemo, useRef } from "react";
import { useSpaces } from "@/components/providers/spaces-provider";
import {
  HorizontalScroller,
  HorizontalScrollerContainerClasses
} from "@/components/horizonal-scroller/horizonal-scroller";
import { cn } from "@/lib/utils";
import { SpaceSidebar } from "@/components/browser-ui/sidebar/content/space-sidebar";

// Very glitchy when enabled
const ONLY_SHOW_NEARBY_SPACES: boolean = false;

export function ScrollableSidebarContent() {
  const { spaces, currentSpace, setCurrentSpace } = useSpaces();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentIndex = useMemo(() => {
    return spaces.findIndex((space) => space.id === currentSpace?.id);
  }, [spaces, currentSpace]);

  const { visibleSpaces, adjustedTargetIndex } = useMemo(() => {
    if (ONLY_SHOW_NEARBY_SPACES) {
      if (currentIndex === -1 || spaces.length <= 1) {
        // Handle cases: no current space, or only one space exists
        return { visibleSpaces: spaces, adjustedTargetIndex: Math.max(0, currentIndex) };
      }

      const indicesToShow = [currentIndex - 1, currentIndex, currentIndex + 1].filter(
        (index) => index >= 0 && index < spaces.length
      );

      const visible = indicesToShow.map((index) => spaces[index]);
      const adjustedIndex = visible.findIndex((space) => space.id === currentSpace?.id);

      // Ensure adjustedIndex is valid (should always be found if currentIndex is valid)
      return { visibleSpaces: visible, adjustedTargetIndex: Math.max(0, adjustedIndex) };
    } else {
      // Show all spaces
      return { visibleSpaces: spaces, adjustedTargetIndex: Math.max(0, currentIndex) };
    }
  }, [spaces, currentSpace, currentIndex]);

  const children = useMemo(() => {
    return visibleSpaces.map((space) => (
      <div key={space.id} className="h-full w-full flex-shrink-0">
        <SpaceSidebar space={space} />
      </div>
    ));
  }, [visibleSpaces]);

  const onSpaceSwitched = (index: number) => {
    // index is relative to the array used (either spaces or filtered visibleSpaces)
    const targetSpaces = ONLY_SHOW_NEARBY_SPACES ? visibleSpaces : spaces;
    const space = targetSpaces[index];
    if (!space) return;
    setCurrentSpace(space.id);
  };

  return (
    <SidebarContent ref={containerRef} className={cn(HorizontalScrollerContainerClasses)}>
      <HorizontalScroller
        key={ONLY_SHOW_NEARBY_SPACES ? currentSpace?.id || "no-space" : "all-spaces"}
        containerRef={containerRef}
        onChanged={onSpaceSwitched}
        targetIndex={adjustedTargetIndex}
        overscrollPercent={ONLY_SHOW_NEARBY_SPACES ? 0.1 : 0}
      >
        {children}
      </HorizontalScroller>
    </SidebarContent>
  );
}
