import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PageLayoutParams } from "~/flow/types";
import { cn } from "@/lib/utils";
import { useBrowserSidebar } from "@/components/browser-ui/browser-sidebar/provider";
import { useAdaptiveTopbar } from "@/components/browser-ui/adaptive-topbar";
import { useSpaces } from "@/components/providers/spaces-provider";
import type { TabPlaceholderUpdate } from "~/types/tabs";
import "./browser-content.css";

const PLACEHOLDER_CLEAR_DELAY_MS = 180;

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
  const { topbarHeight, topbarVisible, contentTopOffset } = useAdaptiveTopbar();
  const { currentSpace } = useSpaces();

  // Tab-sync placeholder: screenshot shown when the active tab's view
  // has been moved to another window.
  const [placeholderSnapshotId, setPlaceholderSnapshotId] = useState<string | null>(null);
  const clearPlaceholderTimeoutRef = useRef<number | null>(null);
  const latestPlaceholderGenerationRef = useRef(0);
  const currentSpaceIdRef = useRef<string | null>(currentSpace?.id ?? null);

  useEffect(() => {
    const clearPendingPlaceholder = () => {
      if (clearPlaceholderTimeoutRef.current !== null) {
        window.clearTimeout(clearPlaceholderTimeoutRef.current);
        clearPlaceholderTimeoutRef.current = null;
      }
    };

    const unsub = flow.tabs.onPlaceholderChanged(({ snapshotId, generation, spaceId }: TabPlaceholderUpdate) => {
      if (spaceId !== currentSpaceIdRef.current) {
        return;
      }
      if (generation < latestPlaceholderGenerationRef.current) {
        return;
      }
      latestPlaceholderGenerationRef.current = generation;
      clearPendingPlaceholder();

      if (snapshotId) {
        setPlaceholderSnapshotId(snapshotId);
        return;
      }

      setPlaceholderSnapshotId((currentSnapshotId) => {
        if (!currentSnapshotId) return currentSnapshotId;

        clearPlaceholderTimeoutRef.current = window.setTimeout(() => {
          clearPlaceholderTimeoutRef.current = null;
          setPlaceholderSnapshotId(null);
        }, PLACEHOLDER_CLEAR_DELAY_MS);

        return currentSnapshotId;
      });
    });

    return () => {
      clearPendingPlaceholder();
      unsub();
    };
  }, []);

  useEffect(() => {
    currentSpaceIdRef.current = currentSpace?.id ?? null;
    if (clearPlaceholderTimeoutRef.current !== null) {
      window.clearTimeout(clearPlaceholderTimeoutRef.current);
      clearPlaceholderTimeoutRef.current = null;
    }
    setPlaceholderSnapshotId(null);
  }, [currentSpace?.id]);

  const placeholderUrl = placeholderSnapshotId ? `flow-internal://tab-snapshot?id=${placeholderSnapshotId}` : null;

  // Derive sidebar visibility from the mode.
  // Floating sidebars are overlays (PortalComponent) and have zero layout impact.
  const sidebarVisible = mode.startsWith("attached-");

  // Use attachedDirection (always correct) rather than deriving from mode.
  // When mode="hidden" during a close animation, mode doesn't encode the side,
  // but the main process still needs it to shrink space from the correct edge.
  const sidebarSide = attachedDirection;

  // Helper: build and send layout params to the main process.
  const sendLayoutParams = useCallback(
    (sidebarWidth: number) => {
      const params: PageLayoutParams = {
        topbarHeight,
        topbarVisible,
        sidebarWidth,
        sidebarSide,
        sidebarVisible,
        sidebarAnimating: isAnimating,
        contentTopOffset
      };
      flow.page.setLayoutParams(params);
    },
    [contentTopOffset, isAnimating, sidebarSide, sidebarVisible, topbarHeight, topbarVisible]
  );

  // Send layout params whenever reactive state changes (visibility, animation,
  // topbar, direction). Uses the ref for sidebarWidth since it's always current.
  useLayoutEffect(() => {
    sendLayoutParams(recordedSidebarSizeRef.current);
  }, [
    topbarHeight,
    topbarVisible,
    sidebarVisible,
    sidebarSide,
    isAnimating,
    contentTopOffset,
    sendLayoutParams,
    recordedSidebarSizeRef
  ]);

  // Subscribe to sidebar resize (drag) events. The callback fires outside
  // the React render cycle, so it doesn't cause re-renders of any consumer.
  // We keep a ref to the latest sendLayoutParams so the subscription closure
  // always uses current topbar/sidebar state without needing to re-subscribe.
  const sendLayoutParamsRef = useRef(sendLayoutParams);
  sendLayoutParamsRef.current = sendLayoutParams;

  useLayoutEffect(() => {
    return onSidebarResize((width) => {
      sendLayoutParamsRef.current(width);
    });
  }, [onSidebarResize]);

  return (
    <div
      className={cn(
        "rounded-lg",
        "flex-1 relative remove-app-drag",
        "bg-white/15",
        // Better shadow for the browser content
        "browser-content-shadow"
        // "shadow-xl shadow-black/20"
      )}
    >
      {placeholderUrl && (
        <img
          src={placeholderUrl}
          alt=""
          draggable={false}
          onError={() => setPlaceholderSnapshotId(null)}
          className="absolute inset-0 w-full h-full rounded-lg object-fill opacity-50 pointer-events-none"
        />
      )}
    </div>
  );
}

// Use memo to prevent unnecessary re-renders
export default memo(BrowserContent);
