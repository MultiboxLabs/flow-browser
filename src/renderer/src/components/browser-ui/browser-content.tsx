import { memo, useLayoutEffect, useRef } from "react";
import { PageLayoutParams } from "~/flow/types";
import { cn } from "@/lib/utils";
import { useBrowserSidebar } from "@/components/browser-ui/browser-sidebar/provider";
import { useRippleSidebar } from "@/components/browser-ui/ripple-sidebar/provider";
import { useAdaptiveTopbar } from "@/components/browser-ui/adaptive-topbar";

/**
 * BrowserContent is the placeholder div that represents the page content area.
 * Instead of measuring its bounds via getBoundingClientRect(), it sends
 * declarative layout parameters to the main process, which computes exact
 * pixel bounds from getContentSize() + these parameters.
 *
 * Uses useLayoutEffect (not useEffect) so the IPC message is sent BEFORE
 * the browser paints. This synchronizes the main-process interpolation start
 * with the CSS transition start — both originate from the same commit.
 * With useEffect, the IPC would fire after paint, putting the interpolation
 * a full frame (~16ms) behind the CSS transition.
 *
 * See design/DECLARATIVE_PAGE_BOUNDS.md for the full design.
 */
function BrowserContent() {
  const { mode, recordedSidebarSizeRef, isAnimating, attachedDirection, onSidebarResize } = useBrowserSidebar();
  const {
    isVisible: rippleVisible,
    isAnimating: rippleAnimating,
    recordedSidebarSizeRef: rippleSizeRef,
    onSidebarResize: onRippleResize
  } = useRippleSidebar();
  const { topbarHeight, topbarVisible, contentTopOffset } = useAdaptiveTopbar();

  // Derive sidebar visibility from the mode.
  // Floating sidebars are overlays (PortalComponent) and have zero layout impact.
  const sidebarVisible = mode.startsWith("attached-");

  // Use attachedDirection (always correct) rather than deriving from mode.
  // When mode="hidden" during a close animation, mode doesn't encode the side,
  // but the main process still needs it to shrink space from the correct edge.
  const sidebarSide = attachedDirection;

  // Helper: build and send layout params to the main process.
  const sendLayoutParams = (sidebarWidth: number, rippleWidth?: number) => {
    const params: PageLayoutParams = {
      topbarHeight,
      topbarVisible,
      sidebarWidth,
      sidebarSide,
      sidebarVisible,
      sidebarAnimating: isAnimating,
      contentTopOffset,
      rippleSidebarWidth: rippleWidth ?? rippleSizeRef.current,
      rippleSidebarVisible: rippleVisible,
      rippleSidebarAnimating: rippleAnimating
    };
    flow.page.setLayoutParams(params);
  };

  // Send layout params whenever reactive state changes (visibility, animation,
  // topbar, direction). Uses the ref for sidebarWidth since it's always current.
  useLayoutEffect(() => {
    sendLayoutParams(recordedSidebarSizeRef.current, rippleSizeRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    topbarHeight,
    topbarVisible,
    sidebarVisible,
    sidebarSide,
    isAnimating,
    contentTopOffset,
    rippleVisible,
    rippleAnimating
  ]);

  // Subscribe to sidebar resize (drag) events. The callback fires outside
  // the React render cycle, so it doesn't cause re-renders of any consumer.
  // We keep a ref to the latest sendLayoutParams so the subscription closure
  // always uses current topbar/sidebar state without needing to re-subscribe.
  const sendLayoutParamsRef = useRef(sendLayoutParams);
  sendLayoutParamsRef.current = sendLayoutParams;

  // Subscribe to main sidebar resize
  useLayoutEffect(() => {
    return onSidebarResize((width) => {
      sendLayoutParamsRef.current(width);
    });
  }, [onSidebarResize]);

  // Subscribe to Ripple sidebar resize
  useLayoutEffect(() => {
    return onRippleResize((width) => {
      sendLayoutParamsRef.current(recordedSidebarSizeRef.current, width);
    });
  }, [onRippleResize, recordedSidebarSizeRef]);

  return (
    <div className={cn("rounded-lg", "flex-1 relative remove-app-drag", "bg-white/20", "shadow-xl shadow-black/20")} />
  );
}

// Use memo to prevent unnecessary re-renders
export default memo(BrowserContent);
