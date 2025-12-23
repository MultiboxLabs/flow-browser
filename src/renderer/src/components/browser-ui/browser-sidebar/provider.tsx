import { useFloatingSidebarTrigger } from "@/components/browser-ui/browser-sidebar/floating-sidebar-trigger";
import { useSettings } from "@/components/providers/settings-provider";
import { generateUUID } from "@/lib/utils";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useMount } from "react-use";

// Configuration //
export const MIN_SIDEBAR_WIDTH = 150;
export const DEFAULT_SIDEBAR_SIZE = 200;
export const MAX_SIDEBAR_WIDTH = 500;

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

export function saveSidebarSize(size: number) {
  try {
    localStorage.setItem("BROWSER_SIDEBAR_SIZE", size.toString());
    return true;
  } catch (error) {
    console.warn("Failed to save sidebar size to localStorage:", error);
    return false;
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
}

export function BrowserSidebarProvider({ children }: BrowserSidebarProviderProps) {
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

  // Visibility State //
  // Wait until the attached direction is loaded before rendering the sidebar first time.
  const [isVisible, setVisible] = useState(false);
  const hasFirstRenderedRef = useRef(false);
  if (!hasFirstRenderedRef.current && attachedDirectionSetting) {
    hasFirstRenderedRef.current = true;
    setVisible(true);
  }

  // Floating Sidebar //
  const isFloating = useFloatingSidebarTrigger(attachedDirectionRef);

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

  // Helpers //
  useMount(() => {
    // Remove window buttons until the window controls component takes over.
    flow.interface.setWindowButtonVisibility(false);
  });

  // Listeners //
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  useEffect(() => {
    const removeListener = flow.interface.onToggleSidebar(() => {
      setVisible(!isVisibleRef.current);
    });
    return () => {
      removeListener();
    };
  }, [isVisibleRef, setVisible]);

  let mode: BrowserSidebarMode = "hidden";
  if (isVisible) {
    mode = `attached-${attachedDirection}`;
  } else if (isFloating) {
    mode = `floating-${attachedDirection}`;
  }

  // Provider //
  return (
    <BrowserSidebarContext.Provider
      value={{
        isVisible: isFloating ? true : isVisible,
        setVisible,

        attachedDirection,

        isAnimating,
        startAnimation,
        stopAnimation,

        mode,
        recordedSidebarSizeRef
      }}
    >
      {children}
    </BrowserSidebarContext.Provider>
  );
}
