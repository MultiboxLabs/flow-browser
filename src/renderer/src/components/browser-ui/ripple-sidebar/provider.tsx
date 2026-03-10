import { useBrowserSidebar } from "@/components/browser-ui/browser-sidebar/provider";
import { generateUUID } from "@/lib/utils";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// Configuration //
export const MIN_RIPPLE_SIDEBAR_WIDTH = 250;
export const DEFAULT_RIPPLE_SIDEBAR_SIZE = 320;
export const MAX_RIPPLE_SIDEBAR_WIDTH = 600;

/** Duration of the sidebar open/close CSS transition (ms). Must match the CSS transition. */
const RIPPLE_SIDEBAR_ANIMATE_TIME = 100;

// Helper Functions //
function getInitialRippleSidebarSize() {
  try {
    const savedSize = localStorage.getItem("RIPPLE_SIDEBAR_SIZE");
    if (savedSize !== null) {
      const parsedSize = parseFloat(savedSize);
      if (!isNaN(parsedSize) && parsedSize >= MIN_RIPPLE_SIDEBAR_WIDTH && parsedSize <= MAX_RIPPLE_SIDEBAR_WIDTH) {
        return parsedSize;
      }
    }
  } catch (error) {
    console.warn("Failed to load Ripple sidebar size from localStorage:", error);
  }
  return DEFAULT_RIPPLE_SIDEBAR_SIZE;
}

// Debounced save function
let saveRippleSizeTimeout: NodeJS.Timeout | null = null;
let pendingRippleSize: number | null = null;

function saveRippleSizeToLocalStorage(size: number) {
  try {
    localStorage.setItem("RIPPLE_SIDEBAR_SIZE", size.toString());
    return true;
  } catch (error) {
    console.warn("Failed to save Ripple sidebar size to localStorage:", error);
    return false;
  }
}

export function saveRippleSidebarSize(size: number) {
  pendingRippleSize = size;
  if (saveRippleSizeTimeout !== null) {
    clearTimeout(saveRippleSizeTimeout);
  }
  saveRippleSizeTimeout = setTimeout(() => {
    if (pendingRippleSize !== null) {
      saveRippleSizeToLocalStorage(pendingRippleSize);
      pendingRippleSize = null;
    }
    saveRippleSizeTimeout = null;
  }, 50);
}

export function flushRippleSidebarSize() {
  if (saveRippleSizeTimeout !== null) {
    clearTimeout(saveRippleSizeTimeout);
    saveRippleSizeTimeout = null;
  }
  if (pendingRippleSize !== null) {
    saveRippleSizeToLocalStorage(pendingRippleSize);
    pendingRippleSize = null;
  }
}

// Context //
export type RippleSidebarSide = "left" | "right";

interface RippleSidebarContextValue {
  isVisible: boolean;
  setVisible: (isVisible: boolean) => void;

  /** Whether Ripple is enabled in settings. When false, nothing is shown. */
  isEnabled: boolean;

  /** The side where the Ripple sidebar is rendered (always opposite of the main sidebar). */
  side: RippleSidebarSide;

  isAnimating: boolean;
  startAnimation: () => string;
  stopAnimation: (animationId: string) => void;

  recordedSidebarSizeRef: React.RefObject<number>;

  /**
   * Subscribe to sidebar width changes during drag resize.
   * Returns an unsubscribe function.
   */
  onSidebarResize: (callback: (width: number) => void) => () => void;
  /** Call when sidebar width changes (e.g. during drag). Updates ref, persists, and notifies listeners. */
  notifySidebarResize: (width: number) => void;
}

const RippleSidebarContext = createContext<RippleSidebarContextValue | null>(null);

export const useRippleSidebar = () => {
  const context = useContext(RippleSidebarContext);
  if (!context) {
    throw new Error("useRippleSidebar must be used within a RippleSidebarProvider");
  }
  return context;
};

interface RippleSidebarProviderProps {
  children: React.ReactNode;
  isEnabled: boolean;
}

/** Noop unsubscribe function. */
const noop = () => {};

/** Dummy ref for disabled state. */
const DISABLED_SIZE_REF = { current: DEFAULT_RIPPLE_SIDEBAR_SIZE };

export function RippleSidebarProvider({ children, isEnabled }: RippleSidebarProviderProps) {
  // Derive the side from the main sidebar's attached direction (always opposite).
  const { attachedDirection } = useBrowserSidebar();
  const side: RippleSidebarSide = attachedDirection === "left" ? "right" : "left";

  // Load sidebar size from localStorage, fallback to default
  const recordedSidebarSizeRef = useRef(DEFAULT_RIPPLE_SIDEBAR_SIZE);
  useMemo(() => {
    recordedSidebarSizeRef.current = getInitialRippleSidebarSize();
  }, []);

  // Callback-based sidebar resize notification.
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
      saveRippleSidebarSize(width);
      for (const listener of sidebarResizeListenersRef.current) {
        listener(width);
      }
    }
  }, []);

  // Visibility State //
  const [isVisible, setVisible] = useState(false);

  // Running Animation //
  const [runningAnimationId, setRunningAnimationId] = useState<string | null>(null);
  const isAnimating = runningAnimationId !== null;

  const startAnimation = useCallback(() => {
    const animationId = generateUUID();
    setRunningAnimationId(animationId);
    return animationId;
  }, []);

  const stopAnimation = useCallback((animationId: string) => {
    setRunningAnimationId((prev) => {
      if (prev === animationId) {
        return null;
      }
      return prev;
    });
  }, []);

  // Wrapped setVisible that atomically starts animation with visibility change.
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  const handleSetVisible = useCallback(
    (newVisible: boolean) => {
      if (newVisible !== isVisibleRef.current) {
        const animId = startAnimation();
        setTimeout(() => stopAnimation(animId), RIPPLE_SIDEBAR_ANIMATE_TIME);
      }
      setVisible(newVisible);
    },
    [startAnimation, stopAnimation]
  );

  // Flush pending saves on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushRippleSidebarSize();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushRippleSidebarSize();
    };
  }, []);

  // Listen for Ripple sidebar toggle from main process (keyboard shortcut / IPC)
  useEffect(() => {
    // When disabled, don't listen for toggle events.
    if (!isEnabled) return;

    const removeListener = flow.ripple.onToggleSidebar(() => {
      handleSetVisible(!isVisibleRef.current);
    });
    return () => {
      removeListener();
    };
  }, [handleSetVisible, isEnabled]);

  // When Ripple is disabled, force the sidebar closed immediately.
  useEffect(() => {
    if (!isEnabled && isVisibleRef.current) {
      setVisible(false);
    }
  }, [isEnabled]);

  // Provider //
  // When disabled, provide a dummy context that shows nothing.
  if (!isEnabled) {
    return (
      <RippleSidebarContext.Provider
        value={{
          isVisible: false,
          setVisible: noop,

          isEnabled: false,

          side,

          isAnimating: false,
          startAnimation: () => "",
          stopAnimation: noop,

          recordedSidebarSizeRef: DISABLED_SIZE_REF,

          onSidebarResize: () => noop,
          notifySidebarResize: noop
        }}
      >
        {children}
      </RippleSidebarContext.Provider>
    );
  }

  return (
    <RippleSidebarContext.Provider
      value={{
        isVisible,
        setVisible: handleSetVisible,

        isEnabled: true,

        side,

        isAnimating,
        startAnimation,
        stopAnimation,

        recordedSidebarSizeRef,

        onSidebarResize,
        notifySidebarResize
      }}
    >
      {children}
    </RippleSidebarContext.Provider>
  );
}
