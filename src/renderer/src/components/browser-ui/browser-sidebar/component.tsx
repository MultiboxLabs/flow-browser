import { SidebarWindowControlsMacOS } from "@/components/browser-ui/window-controls/macos";
import { usePlatform } from "@/components/main/platform";
import { cn } from "@/lib/utils";
import { usePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useMount } from "react-use";
import { type AttachedDirection, useBrowserSidebar } from "./provider";
import { type SidebarVariant } from "@/components/browser-ui/main";

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

const SIDEBAR_ANIMATE_TIME = 150;
const SIDEBAR_ANIMATE_CLASS = "duration-150 ease-in-out";

export function BrowserSidebar({ direction, variant }: { direction: AttachedDirection; variant: SidebarVariant }) {
  const { isVisible, startAnimation, stopAnimation } = useBrowserSidebar();

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

  // Render Component //
  return (
    <div
      className={cn(
        "h-full overflow-hidden w-[20%]",
        "transition-margin",
        variant === "floating" && "fixed left-0 top-0 p-2",
        SIDEBAR_ANIMATE_CLASS,
        direction === "left" && (currentlyVisible ? "ml-0" : "-ml-[20%]"),
        direction === "right" && (currentlyVisible ? "mr-0" : "-mr-[20%]")
      )}
    >
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
    </div>
  );
}
