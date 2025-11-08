import { useFloatingSidebarTrigger } from "@/components/browser-ui/browser-sidebar/floating-sidebar-trigger";
import { useSettings } from "@/components/providers/settings-provider";
import { generateUUID } from "@/lib/utils";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useMount } from "react-use";

// Configuration //
export const MIN_SIDEBAR_WIDTH = 15;
export const DEFAULT_SIDEBAR_SIZE = 20;
export const MAX_SIDEBAR_WIDTH = 30;

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

  const attachedDirection = getSetting<AttachedDirection>("sidebarSide") ?? "left";
  const attachedDirectionRef = useRef(attachedDirection);
  attachedDirectionRef.current = attachedDirection;

  const recordedSidebarSizeRef = useRef(DEFAULT_SIDEBAR_SIZE);

  // States //
  const [isVisible, setVisible] = useState(false);

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
