import { cn } from "@/lib/utils";
import { usePresence } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMount } from "react-use";
import {
  type RippleSidebarSide,
  useRippleSidebar,
  MIN_RIPPLE_SIDEBAR_WIDTH,
  MAX_RIPPLE_SIDEBAR_WIDTH
} from "./provider";
import { type ImperativeResizablePanelWrapperHandle, PixelBasedResizablePanel } from "@/components/ui/resizable-extras";
import { RippleSidebarInner } from "./inner";

const RIPPLE_SIDEBAR_ANIMATE_TIME = 100;
const RIPPLE_SIDEBAR_ANIMATE_CLASS = "duration-100 ease-in-out";

export function RippleSidebar({
  direction,
  order,
  skipEntryAnimation = false
}: {
  direction: RippleSidebarSide;
  order: number;
  skipEntryAnimation?: boolean;
}) {
  const { isVisible, startAnimation, stopAnimation, recordedSidebarSizeRef, notifySidebarResize } = useRippleSidebar();

  const panelRef = useRef<ImperativeResizablePanelWrapperHandle>(null);

  // AnimatePresence Controller //
  const [isPresent, safeToRemove] = usePresence();
  const removingRef = useRef(false);

  // Animation Readiness //
  const animatedRef = useRef<HTMLDivElement>(null);
  const [isAnimationReady, setAnimationReady] = useState(skipEntryAnimation);
  useLayoutEffect(() => {
    if (!isPresent) return;

    if (skipEntryAnimation) {
      setAnimationReady(true);
      return;
    }

    setAnimationReady(false);

    const el = animatedRef.current;
    if (el) {
      void el.getBoundingClientRect();
    }
    const win = el?.ownerDocument?.defaultView ?? window;
    let innerRafId: number;
    const outerRafId = win.requestAnimationFrame(() => {
      innerRafId = win.requestAnimationFrame(() => {
        setAnimationReady(true);
      });
    });
    return () => {
      win.cancelAnimationFrame(outerRafId);
      if (innerRafId !== undefined) win.cancelAnimationFrame(innerRafId);
    };
  }, [skipEntryAnimation, isPresent]);

  const currentlyVisible = isVisible && isAnimationReady && isPresent;

  useEffect(() => {
    if (!isPresent) {
      if (removingRef.current) return;
      removingRef.current = true;

      const animId = startAnimation();
      setTimeout(() => {
        if (removingRef.current) {
          safeToRemove();
          stopAnimation(animId);
        }
      }, RIPPLE_SIDEBAR_ANIMATE_TIME);
    } else {
      removingRef.current = false;
    }
  }, [isPresent, safeToRemove, startAnimation, stopAnimation]);

  useMount(() => {
    if (skipEntryAnimation) return;
    const animId = startAnimation();
    setTimeout(() => {
      stopAnimation(animId);
    }, RIPPLE_SIDEBAR_ANIMATE_TIME);
  });

  // Sidebar Panel Size //
  const updateSidebarSize = useCallback(() => {
    const currentPanelSize = panelRef.current?.getSizePixels();
    if (currentPanelSize) {
      notifySidebarResize(currentPanelSize);
    }
  }, [notifySidebarResize]);

  useEffect(() => {
    const onWindowResize = () => updateSidebarSize();
    const onPointerUp = () => updateSidebarSize();

    window.addEventListener("resize", onWindowResize);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [updateSidebarSize]);

  useEffect(() => {
    const rafId = requestAnimationFrame(updateSidebarSize);
    return () => cancelAnimationFrame(rafId);
  }, [updateSidebarSize]);

  // Render //
  const content = (
    <div
      className={cn(
        "w-full h-full max-h-screen remove-app-drag",
        "transition-transform",
        RIPPLE_SIDEBAR_ANIMATE_CLASS,
        "flex flex-col"
      )}
    >
      <div
        className={cn(
          "m-3 mb-0 flex-1 min-h-0",
          "flex flex-col",
          "select-none",
          direction === "left" && "mr-0",
          direction === "right" && "ml-0"
        )}
      >
        {/* Ripple sidebar content */}
        <RippleSidebarInner />
      </div>
    </div>
  );

  const attachedClassName = cn(
    "h-full overflow-hidden w-[calc(var(--panel-size)+30px)]",
    "transition-[margin]",
    RIPPLE_SIDEBAR_ANIMATE_CLASS,
    direction === "left" && (currentlyVisible ? "ml-0" : "-ml-[var(--panel-size)]"),
    direction === "right" && (currentlyVisible ? "mr-0" : "-mr-[var(--panel-size)]"),
    !currentlyVisible && "!flex-[unset]"
  );

  const attachedStyle = {
    "--panel-size": `${recordedSidebarSizeRef.current}px`
  } as React.CSSProperties;

  return (
    <PixelBasedResizablePanel
      id="ripple-sidebar"
      wrapperRef={panelRef}
      order={order}
      defaultSizePixels={recordedSidebarSizeRef.current}
      className={attachedClassName}
      style={attachedStyle}
      minSizePixels={MIN_RIPPLE_SIDEBAR_WIDTH}
      maxSizePixels={MAX_RIPPLE_SIDEBAR_WIDTH}
      onResize={updateSidebarSize}
    >
      {content}
    </PixelBasedResizablePanel>
  );
}
