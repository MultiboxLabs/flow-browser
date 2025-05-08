import { SidebarSide } from "@/components/browser-ui/main";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef } from "react";

export function SidebarHoverDetector({ side, started }: { side: SidebarSide; started: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseEnter = useCallback(() => {
    started();
  }, [started]);

  useEffect(() => {
    const component = ref.current;

    if (component) {
      component.addEventListener("mouseenter", onMouseEnter);
    }

    return () => {
      if (component) {
        component.removeEventListener("mouseenter", onMouseEnter);
      }
    };
  }, [onMouseEnter]);

  return (
    <div
      ref={ref}
      className={cn(
        "remove-app-drag absolute top-0 w-1.5 h-full overflow-hidden z-50",
        side === "left" ? "left-0" : "right-0"
      )}
    />
  );
}
