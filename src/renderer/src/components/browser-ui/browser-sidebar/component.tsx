import { cn } from "@/lib/utils";
import { usePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMount } from "react-use";
import {
  type AttachedDirection,
  useBrowserSidebar,
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  saveSidebarSize
} from "./provider";
import { type SidebarVariant } from "@/components/browser-ui/main";
import { useAdaptiveTopbar } from "@/components/browser-ui/adaptive-topbar";
import { SidebarInner } from "./inner";
import { type ImperativeResizablePanelWrapperHandle, PixelBasedResizablePanel } from "@/components/ui/resizable-extras";

// Component //

const SIDEBAR_ANIMATE_TIME = 100;
const SIDEBAR_ANIMATE_CLASS = "duration-100 ease-in-out";

export function BrowserSidebar({
  direction,
  variant,
  order
}: {
  direction: AttachedDirection;
  variant: SidebarVariant;
  order: number;
}) {
  const isFloating = variant === "floating";

  const { isVisible, startAnimation, stopAnimation, recordedSidebarSizeRef } = useBrowserSidebar();
  const { topbarHeight } = useAdaptiveTopbar();

  const divRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<ImperativeResizablePanelWrapperHandle>(null);

  // Animation Readiness //
  // This is needed so that on the first few frames, the width will start from 0 instead of the full width.
  const [isAnimationReady, setAnimationReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAnimationReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const currentlyVisible = isVisible && isAnimationReady;

  // AnimatedPresence Controller (from motion/react) //
  const [isPresent, safeToRemove] = usePresence();
  const removingRef = useRef(false);

  useEffect(() => {
    // Remove from DOM 150ms after being removed from React
    if (!isPresent) {
      if (removingRef.current) return;
      removingRef.current = true;
      const animId = startAnimation();
      setTimeout(() => {
        if (removingRef.current) {
          safeToRemove();
          stopAnimation(animId);
        }
      }, SIDEBAR_ANIMATE_TIME);
    } else {
      removingRef.current = false;
    }
  }, [isPresent, safeToRemove, startAnimation, stopAnimation]);

  useMount(() => {
    // Register animation as started when the component is mounted, and wait until animation is complete.
    const animId = startAnimation();
    setTimeout(() => {
      stopAnimation(animId);
    }, SIDEBAR_ANIMATE_TIME);
  });

  // Sidebar Panel Size //
  // Note: change in panel size does not trigger a re-render! instead, this only records the size for the next render. (which should be when the user is toggling sidebar)
  const updateSidebarSize = useCallback(() => {
    const currentPanelSize = panelRef.current?.getSizePixels();
    if (currentPanelSize && recordedSidebarSizeRef.current !== currentPanelSize) {
      recordedSidebarSizeRef.current = currentPanelSize;

      // Persist sidebar size to localStorage
      saveSidebarSize(currentPanelSize);
    }
  }, [recordedSidebarSizeRef]);

  // Update sidebar size immediately and then every second
  useEffect(() => {
    setInterval(updateSidebarSize, 1000);
  }, [updateSidebarSize]);

  // Render Component //
  const commonClassName = cn(
    "h-full overflow-hidden w-[var(--panel-size)]",
    "transition-[margin]",
    isFloating && (direction === "left" ? "fixed left-0 p-2" : "fixed right-0 p-2"),
    isFloating && `top-[var(--offset-top)] h-[max(100vh-var(--offset-top),0px)]`,
    isFloating && topbarHeight > 0 && `pt-[calc(8px-var(--offset-top))]`,
    SIDEBAR_ANIMATE_CLASS,
    direction === "left" && (currentlyVisible ? "ml-0" : "-ml-[var(--panel-size)]"),
    direction === "right" && (currentlyVisible ? "mr-0" : "-mr-[var(--panel-size)]"),
    // Remove flex so the sidebar hiding animation can play correctly
    !currentlyVisible && "!flex-[unset]"
  );

  const commonStyle = {
    "--panel-size": `${recordedSidebarSizeRef.current}px`,
    "--offset-top": `${topbarHeight}px`
  } as React.CSSProperties;

  const content = (
    <div
      className={cn(
        "w-full h-full remove-app-drag",
        "transition-transform",
        SIDEBAR_ANIMATE_CLASS,
        "flex flex-col",
        isFloating && "rounded-lg border border-sidebar-border bg-space-background-start"
      )}
    >
      <div
        className={cn(
          "m-3 flex-1",
          "flex flex-col",
          "select-none",
          direction === "left" && !isFloating && "mr-0",
          direction === "right" && !isFloating && "ml-0"
        )}
      >
        <SidebarInner direction={direction} variant={variant} />
      </div>
    </div>
  );

  return isFloating ? (
    <div id="sidebar" ref={divRef} className={commonClassName} style={commonStyle}>
      {content}
    </div>
  ) : (
    <PixelBasedResizablePanel
      id="sidebar"
      wrapperRef={panelRef}
      order={order}
      defaultSizePixels={recordedSidebarSizeRef.current}
      className={commonClassName}
      style={commonStyle}
      minSizePixels={MIN_SIDEBAR_WIDTH}
      maxSizePixels={MAX_SIDEBAR_WIDTH}
    >
      {content}
    </PixelBasedResizablePanel>
  );
}
