import { type AttachedDirection } from "./provider";
import { useEffect, useRef, useState } from "react";
import { type CursorEdgeEvent } from "~/flow/interfaces/browser/interface";

/**
 * Triggers the floating sidebar when the cursor dwells near a window edge.
 *
 * Uses the main-process cursor edge monitor (via IPC) instead of
 * `document.mousemove`, because tab WebContentsViews sit above the chrome
 * renderer and consume all mouse events in their area.
 */
export function useFloatingSidebarTrigger(
  attachedDirectionRef: React.RefObject<AttachedDirection>,
  sidebarSizeRef: React.RefObject<number>
) {
  const [isFloating, setIsFloating] = useState(false);
  const isFloatingRef = useRef(isFloating);
  isFloatingRef.current = isFloating;

  useEffect(() => {
    const DWELL_MS = 50; // how long the cursor must stay at the edge
    const OUT_MARGIN = 50; // px beyond the sidebar edge to un-float

    let dwellTimer: number | null = null;

    const clearDwell = () => {
      if (dwellTimer != null) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
    };

    const handleCursorEdge = (event: CursorEdgeEvent) => {
      const direction = attachedDirectionRef.current;

      if (!isFloatingRef.current) {
        // Not floating yet: start a dwell timer when cursor is at the matching edge
        if (event.edge === direction) {
          if (dwellTimer == null) {
            dwellTimer = window.setTimeout(() => {
              setIsFloating(true);
              dwellTimer = null;
            }, DWELL_MS);
          }
        } else {
          // Cursor left the matching edge before dwell completed
          clearDwell();
        }
      } else {
        // Currently floating: detach when cursor moves far enough beyond the sidebar
        const sidebarWidth = sidebarSizeRef.current + 30; // portal width (matches PortalComponent width)
        const outThreshold = sidebarWidth + OUT_MARGIN;

        const shouldDetach = direction === "left" ? event.x > outThreshold : event.x < window.innerWidth - outThreshold;

        if (shouldDetach) {
          setIsFloating(false);
          clearDwell();
        }
      }
    };

    const removeListener = flow.interface.onCursorAtEdge(handleCursorEdge);

    return () => {
      removeListener();
      clearDwell();
    };
  }, [attachedDirectionRef, sidebarSizeRef]);

  return isFloating;
}
