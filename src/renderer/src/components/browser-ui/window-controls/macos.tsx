import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { useEffect, useRef, useState } from "react";

// Module-level generation counter to coordinate concurrent instances.
// During variant swaps (attached ↔ floating), both old and new instances
// coexist briefly. The counter ensures only the most recent instance
// controls visibility and position IPC calls.
let globalGeneration = 0;

export function SidebarWindowControlsMacOS({
  offset = 0,
  isAnimating = false
}: {
  offset?: number;
  isAnimating?: boolean;
}) {
  const titlebarRef = useRef<HTMLDivElement>(null);
  const titlebarBounds = useBoundingRect(titlebarRef, { observingWithLoop: isAnimating });
  const generationRef = useRef(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    let updated = false;
    flow.interface.getWindowState().then((state) => {
      if (!updated) {
        setIsFullscreen(state.isFullscreen);
      }
    });
    const removeListener = flow.interface.onWindowStateChanged((state) => {
      setIsFullscreen(state.isFullscreen);
      updated = true;
    });
    return () => {
      removeListener();
    };
  }, []);

  // Position: only update if this is still the latest instance
  useEffect(() => {
    if (titlebarBounds && generationRef.current === globalGeneration) {
      flow.interface.setWindowButtonPosition({
        x: titlebarBounds.left,
        y: titlebarBounds.top - offset
      });
    }
  }, [titlebarBounds, offset]);

  // Visibility: claim ownership on mount, release only if still the latest on unmount.
  // Uses rAF to defer the unmount hide call, so the new instance's mount effect
  // (which runs after the old instance's cleanup) has a chance to bump the generation first.
  useEffect(() => {
    globalGeneration++;
    generationRef.current = globalGeneration;
    flow.interface.setWindowButtonVisibility(true);

    const myGeneration = globalGeneration;
    return () => {
      // Defer the hide call: by the time rAF fires, if a new instance has mounted,
      // globalGeneration will have been bumped and we skip the hide.
      requestAnimationFrame(() => {
        if (globalGeneration === myGeneration) {
          flow.interface.setWindowButtonVisibility(false);
        }
      });
    };
  }, []);

  if (isFullscreen) return null;

  // based on accurate measurements
  return <div ref={titlebarRef} className="w-[60px] h-[14px] remove-app-drag" />;
}
