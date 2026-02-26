import { memo, useRef, useEffect } from "react";
import { PageBounds } from "~/flow/types";
import { cn } from "@/lib/utils";
import { useBoundingRect } from "@/hooks/use-bounding-rect";

const DEBUG_SHOW_BOUNDS = false;

function BrowserContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rect = useBoundingRect(containerRef, { throttleMs: 50 });

  useEffect(() => {
    if (rect) {
      const dimensions: PageBounds = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      };
      flow.page.setPageBounds(dimensions);
    }
  }, [rect]);

  return (
    <div ref={containerRef} className={cn("rounded-lg", "flex-1 relative remove-app-drag", "bg-white/20")}>
      {DEBUG_SHOW_BOUNDS && rect && (
        <div className="absolute top-2 right-2 z-50 text-xs text-muted-foreground bg-background/80 p-1 rounded">
          x: {rect.left.toFixed(0)}, y: {rect.top.toFixed(0)}, w: {rect.width.toFixed(0)}, h: {rect.height.toFixed(0)}
        </div>
      )}
    </div>
  );
}

// Use memo to prevent unnecessary re-renders
export default memo(BrowserContent);
