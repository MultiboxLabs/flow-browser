import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { useEffect, useRef } from "react";
import { useMount, useUnmount } from "react-use";

export function SidebarWindowControlsMacOS({ isAnimating = false }: { isAnimating?: boolean }) {
  const titlebarRef = useRef<HTMLDivElement>(null);
  const titlebarBounds = useBoundingRect(titlebarRef, { observingWithLoop: isAnimating });

  useEffect(() => {
    if (titlebarBounds) {
      flow.interface.setWindowButtonPosition({
        x: titlebarBounds.left,
        y: Math.max(titlebarBounds.top - 5, 9)
      });
    }
  }, [titlebarBounds]);

  useMount(() => {
    flow.interface.setWindowButtonVisibility(true);
  });
  useUnmount(() => {
    flow.interface.setWindowButtonVisibility(false);
  });

  // based on accurate measurements
  return <div ref={titlebarRef} className="w-[60px] h-[16px] remove-app-drag" />;
}
