import { type AttachedDirection } from "./provider";
import { useEffect, useRef, useState } from "react";

export function useFloatingSidebarTrigger(attachedDirectionRef: React.RefObject<AttachedDirection>) {
  const [isFloating, setIsFloating] = useState(false);
  const isFloatingRef = useRef(isFloating);
  isFloatingRef.current = isFloating;

  useEffect(() => {
    const DWELL_MS = 50; // how long the mouse must stay in the edge strip
    const IN_THRESHOLD = 10; // px from edge to trigger floating (enter strip)
    const OUT_THRESHOLD = 250; // px from edge to un-float (leave strip)

    let dwellTimer: number | null = null;
    let lastLocation: [number, number] = [0, 0];

    const insideActivationStrip = (x: number) => {
      if (attachedDirectionRef.current === "left") {
        return x < IN_THRESHOLD;
      } else {
        return x > window.innerWidth - IN_THRESHOLD;
      }
    };

    const shouldDetach = (x: number) => {
      if (attachedDirectionRef.current === "left") {
        return x > OUT_THRESHOLD;
      } else {
        return x < window.innerWidth - OUT_THRESHOLD;
      }
    };

    const clearDwell = () => {
      if (dwellTimer != null) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
    };

    const mouseMoveListener = (event: MouseEvent) => {
      lastLocation = [event.clientX, event.clientY];

      if (isFloatingRef.current === false) {
        // Not floating yet: start/maintain a dwell timer only while inside the strip
        if (insideActivationStrip(event.clientX)) {
          if (dwellTimer == null) {
            dwellTimer = window.setTimeout(() => {
              // On fire: only float if we're STILL inside the strip
              const [lx] = lastLocation;
              if (insideActivationStrip(lx)) setIsFloating(true);
              dwellTimer = null;
            }, DWELL_MS);
          }
        } else {
          // left the strip before dwell completes
          clearDwell();
        }
      } else {
        // Currently floating: detach when we move far enough away
        if (shouldDetach(event.clientX)) {
          setIsFloating(false);
          clearDwell(); // just in case
        }
      }
    };

    document.addEventListener("mousemove", mouseMoveListener);
    return () => {
      document.removeEventListener("mousemove", mouseMoveListener);
      clearDwell();
    };
  }, [attachedDirectionRef]);

  return isFloating;
}
