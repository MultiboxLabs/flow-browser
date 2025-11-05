import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { useEffect, useRef } from "react";
import { useMount, useUnmount } from "react-use";

export function SidebarWindowControlsMacOS({
  offset = 5,
  isAnimating = false
}: {
  offset?: number;
  isAnimating?: boolean;
}) {
  const titlebarRef = useRef<HTMLDivElement>(null);
  const titlebarBounds = useBoundingRect(titlebarRef, { observingWithLoop: isAnimating });

  useEffect(() => {
    if (titlebarBounds) {
      flow.interface.setWindowButtonPosition({
        x: titlebarBounds.left,
        y: Math.max(titlebarBounds.top - offset, 9)
      });
    }
  }, [titlebarBounds, offset]);

  useMount(() => {
    flow.interface.setWindowButtonVisibility(true);
  });
  useUnmount(() => {
    flow.interface.setWindowButtonVisibility(false);
  });

  // based on accurate measurements
  return <div ref={titlebarRef} className="w-[60px] h-[16px] remove-app-drag" />;
}
