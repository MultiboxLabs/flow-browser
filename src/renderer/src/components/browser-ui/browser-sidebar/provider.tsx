import { useSettings } from "@/components/providers/settings-provider";
import { generateUUID } from "@/lib/utils";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useMount } from "react-use";

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

  // States //
  const [isVisible, setVisible] = useState(false);

  // Floating Sidebar //
  const [isFloating, setIsFloating] = useState(false);
  const isFloatingRef = useRef(isFloating);
  isFloatingRef.current = isFloating;

  useEffect(() => {
    let lastLocation: [number, number] = [0, 0];
    const mouseMoveListener = (event: MouseEvent) => {
      lastLocation = [event.clientX, event.clientY];
      if (isFloatingRef.current === false && event.clientX < 10) {
        setTimeout(() => {
          if (lastLocation[0] < 10) {
            setIsFloating(true);
          }
        }, 50);
      } else if (isFloatingRef.current === true && event.clientX > 250) {
        setIsFloating(false);
      }
    };
    document.addEventListener("mousemove", mouseMoveListener);
    return () => {
      document.removeEventListener("mousemove", mouseMoveListener);
    };
  }, []);

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

        mode
      }}
    >
      {children}
    </BrowserSidebarContext.Provider>
  );
}
