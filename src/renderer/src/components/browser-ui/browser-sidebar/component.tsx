import { SidebarWindowControlsMacOS } from "@/components/browser-ui/window-controls/macos";
import { usePlatform } from "@/components/main/platform";
import { cn } from "@/lib/utils";
import { usePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMount } from "react-use";
import { type AttachedDirection, useBrowserSidebar } from "./provider";
import { type SidebarVariant } from "@/components/browser-ui/main";
import { ResizablePanel } from "@/components/ui/resizable";
import { type ImperativePanelHandle } from "react-resizable-panels";

// Component //
function SidebarInner({ direction, variant }: { direction: AttachedDirection; variant: SidebarVariant }) {
  const { isAnimating } = useBrowserSidebar();
  const { platform } = usePlatform();

  return (
    <>
      {direction === "left" && platform === "darwin" && (
        <SidebarWindowControlsMacOS offset={variant === "floating" ? 11 : 5} isAnimating={isAnimating} />
      )}
      <p>Hello Testing</p>
    </>
  );
}

const SIDEBAR_ANIMATE_TIME = 100;
const SIDEBAR_ANIMATE_CLASS = "duration-100 ease-in-out";

const MIN_SIDEBAR_WIDTH = 15;
const DEFAULT_SIDEBAR_SIZE = 20;
const MAX_SIDEBAR_WIDTH = 30;
let recordedSidebarSize = DEFAULT_SIDEBAR_SIZE;

export function BrowserSidebar({
  direction,
  variant,
  order
}: {
  direction: AttachedDirection;
  variant: SidebarVariant;
  order: number;
}) {
  const { isVisible, startAnimation, stopAnimation } = useBrowserSidebar();
  const divRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<ImperativePanelHandle>(null);

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
  const currentPanelSize = panelRef.current?.getSize();
  useMemo(() => {
    if (currentPanelSize) {
      recordedSidebarSize = currentPanelSize;
    }
  }, [currentPanelSize]);

  // Render Component //
  const commonClassName = cn(
    "h-full overflow-hidden w-[var(--panel-size)]",
    "transition-[margin]",
    variant === "floating" && "fixed left-0 top-0 p-2",
    SIDEBAR_ANIMATE_CLASS,
    direction === "left" && (currentlyVisible ? "ml-0" : "-ml-[var(--panel-size)]"),
    direction === "right" && (currentlyVisible ? "mr-0" : "-mr-[var(--panel-size)]"),
    !currentlyVisible && "!flex-[unset]"
  );

  const commonStyle = {
    "--panel-size": `${recordedSidebarSize}%`
  } as React.CSSProperties;

  const content = (
    <div
      className={cn(
        "w-full h-full",
        "transition-transform",
        SIDEBAR_ANIMATE_CLASS,
        "flex flex-col",
        variant === "floating" && "rounded-lg border border-sidebar-border bg-space-background-start"
      )}
    >
      <div
        className={cn("m-4 flex-1", "flex flex-col", direction === "left" && "mr-0", direction === "right" && "ml-0")}
      >
        <SidebarInner direction={direction} variant={variant} />
      </div>
    </div>
  );

  return variant === "floating" ? (
    <div id="sidebar" ref={divRef} className={commonClassName} style={commonStyle}>
      {content}
    </div>
  ) : (
    <ResizablePanel
      id="sidebar"
      ref={panelRef}
      order={order}
      defaultSize={recordedSidebarSize}
      className={commonClassName}
      style={commonStyle}
      minSize={MIN_SIDEBAR_WIDTH}
      maxSize={MAX_SIDEBAR_WIDTH}
    >
      {content}
    </ResizablePanel>
  );
}
