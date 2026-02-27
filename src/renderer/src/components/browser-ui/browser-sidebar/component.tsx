import { cn } from "@/lib/utils";
import { usePresence } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMount } from "react-use";
import { type AttachedDirection, useBrowserSidebar, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from "./provider";
import { type SidebarVariant } from "@/components/browser-ui/main";
import { useAdaptiveTopbar } from "@/components/browser-ui/adaptive-topbar";
import { SidebarInner } from "./inner";
import { type ImperativeResizablePanelWrapperHandle, PixelBasedResizablePanel } from "@/components/ui/resizable-extras";
import { PortalComponent } from "@/components/portal/portal";
import { ViewLayer } from "~/layers";

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

  const { isVisible, startAnimation, stopAnimation, recordedSidebarSizeRef, notifySidebarResize } = useBrowserSidebar();
  const { topbarHeight } = useAdaptiveTopbar();

  const panelRef = useRef<ImperativeResizablePanelWrapperHandle>(null);

  // Animation Readiness //
  // Ensure the browser paints the initial off-screen position before enabling
  // the CSS transition. For portal windows (separate WebContentsViews), the
  // double-rAF technique is unreliable because rAF timing may not align with
  // the portal's paint cycle. Instead, we force a synchronous reflow on the
  // animated element to guarantee the off-screen layout is computed, then
  // wait a single frame for it to be painted.
  const animatedRef = useRef<HTMLDivElement>(null);
  const [isAnimationReady, setAnimationReady] = useState(false);
  useLayoutEffect(() => {
    if (animatedRef.current) {
      void animatedRef.current.getBoundingClientRect();
    }
    const rafId = requestAnimationFrame(() => {
      setAnimationReady(true);
    });
    return () => cancelAnimationFrame(rafId);
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
  // When the panel is resized (drag), notify the provider so BrowserContent
  // can send updated layout params to the main process.
  const updateSidebarSize = useCallback(() => {
    const currentPanelSize = panelRef.current?.getSizePixels();
    if (currentPanelSize) {
      notifySidebarResize(currentPanelSize);
    }
  }, [notifySidebarResize]);

  // Keep persisted sidebar size up-to-date without polling.
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

  // Render Component //

  const content = (
    <div
      className={cn(
        "w-full h-full max-h-screen remove-app-drag",
        "transition-transform",
        SIDEBAR_ANIMATE_CLASS,
        "flex flex-col",
        isFloating && "rounded-lg border border-sidebar-border sidebar-floating-bg"
      )}
    >
      <div
        className={cn(
          "m-3 mb-0 flex-1 min-h-0",
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

  if (isFloating) {
    return (
      <PortalComponent
        className="fixed"
        style={{
          top: topbarHeight,
          [direction === "left" ? "left" : "right"]: 0,
          width: recordedSidebarSizeRef.current + 30,
          height: `calc(100vh - ${topbarHeight}px)`
        }}
        visible={true}
        zIndex={ViewLayer.OVERLAY}
      >
        <div
          ref={animatedRef}
          id="sidebar"
          className={cn(
            "h-full overflow-hidden p-2",
            "transition-transform",
            SIDEBAR_ANIMATE_CLASS,
            currentlyVisible ? "translate-x-0" : direction === "left" ? "-translate-x-full" : "translate-x-full",
            topbarHeight > 0 && `pt-[max(0px,calc(8px-${topbarHeight}px))]`
          )}
        >
          {content}
        </div>
      </PortalComponent>
    );
  }

  const attachedClassName = cn(
    "h-full overflow-hidden w-[calc(var(--panel-size)+30px)]",
    "transition-[margin]",
    SIDEBAR_ANIMATE_CLASS,
    direction === "left" && (currentlyVisible ? "ml-0" : "-ml-[var(--panel-size)]"),
    direction === "right" && (currentlyVisible ? "mr-0" : "-mr-[var(--panel-size)]"),
    // Remove flex so the sidebar hiding animation can play correctly
    !currentlyVisible && "!flex-[unset]"
  );

  const attachedStyle = {
    "--panel-size": `${recordedSidebarSizeRef.current}px`
  } as React.CSSProperties;

  return (
    <PixelBasedResizablePanel
      id="sidebar"
      wrapperRef={panelRef}
      order={order}
      defaultSizePixels={recordedSidebarSizeRef.current}
      className={attachedClassName}
      style={attachedStyle}
      minSizePixels={MIN_SIDEBAR_WIDTH}
      maxSizePixels={MAX_SIDEBAR_WIDTH}
      onResize={updateSidebarSize}
    >
      {content}
    </PixelBasedResizablePanel>
  );
}
