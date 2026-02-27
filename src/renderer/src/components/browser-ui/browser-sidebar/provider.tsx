import { useFloatingSidebarTrigger } from "@/components/browser-ui/browser-sidebar/floating-sidebar-trigger";
import { useSettings } from "@/components/providers/settings-provider";
import { generateUUID } from "@/lib/utils";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useMount } from "react-use";

// Configuration //
export const MIN_SIDEBAR_WIDTH = 150;
export const DEFAULT_SIDEBAR_SIZE = 200;
export const MAX_SIDEBAR_WIDTH = 500;

/** Duration of the sidebar open/close CSS transition (ms). Must match SIDEBAR_ANIMATE_TIME in component.tsx. */
const SIDEBAR_ANIMATE_TIME = 100;

// Helper Functions //
function getInitialSidebarSize() {
  try {
    const savedSize = localStorage.getItem("BROWSER_SIDEBAR_SIZE");
    if (savedSize !== null) {
      const parsedSize = parseFloat(savedSize);
      // Validate the saved size is within bounds
      if (!isNaN(parsedSize) && parsedSize >= MIN_SIDEBAR_WIDTH && parsedSize <= MAX_SIDEBAR_WIDTH) {
        return parsedSize;
      }
    }
  } catch (error) {
    // If localStorage is unavailable or corrupted, use default
    console.warn("Failed to load sidebar size from localStorage:", error);
  }
  return DEFAULT_SIDEBAR_SIZE;
}

// Debounced save function
let saveSidebarSizeTimeout: NodeJS.Timeout | null = null;
let pendingSidebarSize: number | null = null;

function saveToLocalStorage(size: number) {
  try {
    localStorage.setItem("BROWSER_SIDEBAR_SIZE", size.toString());
    return true;
  } catch (error) {
    console.warn("Failed to save sidebar size to localStorage:", error);
    return false;
  }
}

export function saveSidebarSize(size: number) {
  // Store the pending size
  pendingSidebarSize = size;

  // Clear any existing timeout
  if (saveSidebarSizeTimeout !== null) {
    clearTimeout(saveSidebarSizeTimeout);
  }

  // Set a new timeout to save after 50ms
  saveSidebarSizeTimeout = setTimeout(() => {
    if (pendingSidebarSize !== null) {
      saveToLocalStorage(pendingSidebarSize);
      pendingSidebarSize = null;
    }
    saveSidebarSizeTimeout = null;
  }, 50);
}

// Flush any pending saves immediately (for cleanup/unload scenarios)
export function flushSidebarSize() {
  if (saveSidebarSizeTimeout !== null) {
    clearTimeout(saveSidebarSizeTimeout);
    saveSidebarSizeTimeout = null;
  }
  if (pendingSidebarSize !== null) {
    saveToLocalStorage(pendingSidebarSize);
    pendingSidebarSize = null;
  }
}

// Context //
export type AttachedDirection = "left" | "right";
export type BrowserSidebarMode = `attached-${AttachedDirection}` | `floating-${AttachedDirection}` | "hidden";
interface BrowserSidebarContextValue {
  isVisible: boolean;
  setVisible: (isVisible: boolean) => void;

  attachedDirection: AttachedDirection;

  isAnimating: boolean;
  startAnimation: () => string;
  stopAnimation: (animationId: string) => void;

  mode: BrowserSidebarMode;
  recordedSidebarSizeRef: React.RefObject<number>;

  setForceFloating: (forceFloating: boolean) => void;

  /**
   * Subscribe to sidebar width changes during drag resize.
   * The callback receives the new width in pixels.
   * Returns an unsubscribe function.
   */
  onSidebarResize: (callback: (width: number) => void) => () => void;
  /** Call when sidebar width changes (e.g. during drag). Updates ref, persists, and notifies listeners. */
  notifySidebarResize: (width: number) => void;
}

const BrowserSidebarContext = createContext<BrowserSidebarContextValue | null>(null);

export const useBrowserSidebar = () => {
  const context = useContext(BrowserSidebarContext);
  if (!context) {
    throw new Error("useBrowserSidebar must be used within an AdaptiveTopbarProvider");
  }
  return context;
};

interface BrowserSidebarProviderProps {
  children: React.ReactNode;
  /** When false (e.g. popup windows) the sidebar is never initialized as visible. */
  hasSidebar?: boolean;
}

export function BrowserSidebarProvider({ children, hasSidebar = true }: BrowserSidebarProviderProps) {
  const { getSetting } = useSettings();

  const attachedDirectionSetting = getSetting<AttachedDirection>("sidebarSide");
  const attachedDirection = attachedDirectionSetting ?? "left";

  const attachedDirectionRef = useRef(attachedDirection);
  attachedDirectionRef.current = attachedDirection;

  // Load sidebar size from localStorage, fallback to default
  const recordedSidebarSizeRef = useRef(DEFAULT_SIDEBAR_SIZE);
  useMemo(() => {
    recordedSidebarSizeRef.current = getInitialSidebarSize();
  }, []);

  // Callback-based sidebar resize notification.
  // Allows BrowserContent to subscribe without causing context re-renders
  // on every drag frame. The listener set is stored in a ref (stable identity).
  const sidebarResizeListenersRef = useRef(new Set<(width: number) => void>());

  const onSidebarResize = useCallback((callback: (width: number) => void) => {
    sidebarResizeListenersRef.current.add(callback);
    return () => {
      sidebarResizeListenersRef.current.delete(callback);
    };
  }, []);

  const notifySidebarResize = useCallback((width: number) => {
    if (recordedSidebarSizeRef.current !== width) {
      recordedSidebarSizeRef.current = width;
      saveSidebarSize(width);
      for (const listener of sidebarResizeListenersRef.current) {
        listener(width);
      }
    }
  }, []);

  // Visibility State //
  // Wait until the attached direction is loaded before rendering the sidebar first time.
  // For popup windows (hasSidebar=false), the sidebar is never made visible.
  const [isVisible, setVisible] = useState(false);
  const hasFirstRenderedRef = useRef(false);
  if (hasSidebar && !hasFirstRenderedRef.current && attachedDirectionSetting) {
    hasFirstRenderedRef.current = true;
    setVisible(true);
  }

  // Floating Sidebar //
  const isFloating = useFloatingSidebarTrigger(attachedDirectionRef, recordedSidebarSizeRef);

  // Running Animation //
  const [runningAnimationId, setRunningAnimationId] = useState<string | null>(null);
  const isAnimating = runningAnimationId !== null;

  const startAnimation = useCallback(() => {
    const animationId = generateUUID();
    setRunningAnimationId(animationId);
    return animationId;
  }, [setRunningAnimationId]);

  const stopAnimation = useCallback(
    (animationId: string) => {
      setRunningAnimationId((prev) => {
        if (prev === animationId) {
          return null;
        }
        return prev;
      });
    },
    [setRunningAnimationId]
  );

  // Wrapped setVisible that atomically starts animation with visibility change.
  // This ensures BrowserContent sees both isAnimating=true and the mode change
  // in the same React render, so the main process receives correct params for
  // sidebar tween interpolation. Without this, isVisible and isAnimating change
  // in separate render cycles, causing bounds to snap instead of animate.
  // See design/DECLARATIVE_PAGE_BOUNDS.md § "Sidebar Tween Handling".
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  const handleSetVisible = useCallback(
    (newVisible: boolean) => {
      if (newVisible !== isVisibleRef.current) {
        // Start animation in the same synchronous call as setVisible.
        // React 18 batches both setState calls into a single render.
        const animId = startAnimation();
        setTimeout(() => stopAnimation(animId), SIDEBAR_ANIMATE_TIME);
      }
      setVisible(newVisible);
    },
    [startAnimation, stopAnimation]
  );

  // Cancel any running sidebar animation when the floating sidebar is active.
  // The floating sidebar is a portal overlay with zero layout impact, so the
  // main-process bounds should snap immediately rather than interpolating.
  // This covers both directions:
  //   - Hiding attached → floating takes over: snap to full width
  //   - Re-opening attached while floating: snap to sidebar width
  useEffect(() => {
    if (isFloating && runningAnimationId) {
      setRunningAnimationId(null);
    }
  }, [isFloating, runningAnimationId]);

  // Helpers //
  useMount(() => {
    // Remove window buttons until the window controls component takes over.
    flow.interface.setWindowButtonVisibility(false);
  });

  useEffect(() => {
    // Flush any pending sidebar size saves before page unload
    const handleBeforeUnload = () => {
      flushSidebarSize();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also flush on unmount
      flushSidebarSize();
    };
  }, []);

  // Listeners //
  useEffect(() => {
    const removeListener = flow.interface.onToggleSidebar(() => {
      handleSetVisible(!isVisibleRef.current);
    });
    return () => {
      removeListener();
    };
  }, [isVisibleRef, handleSetVisible]);

  const [forceFloating, setForceFloating] = useState(false);

  let mode: BrowserSidebarMode = "hidden";
  if (hasSidebar) {
    if (forceFloating) {
      mode = isFloating ? `floating-${attachedDirection}` : "hidden";
    } else if (isVisible) {
      mode = `attached-${attachedDirection}`;
    } else if (isFloating) {
      mode = `floating-${attachedDirection}`;
    }
  }

  // Provider //
  return (
    <BrowserSidebarContext.Provider
      value={{
        isVisible: isFloating ? true : isVisible,
        setVisible: handleSetVisible,

        attachedDirection,

        isAnimating,
        startAnimation,
        stopAnimation,

        mode,
        recordedSidebarSizeRef,

        onSidebarResize,
        notifySidebarResize,

        setForceFloating
      }}
    >
      {children}
    </BrowserSidebarContext.Provider>
  );
}
