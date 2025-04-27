import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { useEffect, useRef } from "react";

export function SidebarWindowControls() {
  const titlebarRef = useRef<HTMLDivElement>(null);
  const titlebarBounds = useBoundingRect(titlebarRef);

  useEffect(() => {
    if (titlebarBounds) {
      flow.interface.setWindowButtonPosition({
        x: titlebarBounds.x,
        y: titlebarBounds.y
      });
    }
  }, [titlebarBounds]);

  useEffect(() => {
    // Set window buttons visibility
    flow.interface.setWindowButtonVisibility(true);

    return () => {
      flow.interface.setWindowButtonVisibility(false);
    };
  });

  return <div ref={titlebarRef} className="mb-2 mt-0.5 mx-1 h-2 w-full" />;
}
