import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { useEffect, useRef, useState } from "react";
import { useMount, useUnmount } from "react-use";

export function SidebarWindowControlsMacOS({
  offset = 0,
  isAnimating = false
}: {
  offset?: number;
  isAnimating?: boolean;
}) {
  const titlebarRef = useRef<HTMLDivElement>(null);
  const titlebarBounds = useBoundingRect(titlebarRef, { observingWithLoop: isAnimating });

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

  useEffect(() => {
    if (titlebarBounds) {
      flow.interface.setWindowButtonPosition({
        x: titlebarBounds.left,
        y: titlebarBounds.top - offset
      });
    }
  }, [titlebarBounds, offset]);

  useMount(() => {
    flow.interface.setWindowButtonVisibility(true);
  });
  useUnmount(() => {
    flow.interface.setWindowButtonVisibility(false);
  });

  if (isFullscreen) return null;

  // based on accurate measurements
  return <div ref={titlebarRef} className="w-[60px] h-[14px] remove-app-drag" />;
}
