import { useSettings } from "@/components/providers/settings-provider";
import { generateUUID } from "@/lib/utils";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useMount } from "react-use";

// Context //
export type AttachedDirection = "left" | "right";
export type BrowserSidebarMode = `attached-${AttachedDirection}` | "floating" | "hidden";
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

  // Running Animation //
  const [runningAnimationId, setRunningAnimationId] = useState<string>(null);
  const isAnimating = runningAnimationId !== "";

  const startAnimation = useCallback(() => {
    const animationId = generateUUID();
    setRunningAnimationId(animationId);
    return animationId;
  }, [setRunningAnimationId]);

  const stopAnimation = useCallback(
    (animationId: string) => {
      setRunningAnimationId((prev) => {
        if (prev === animationId) {
          return "";
        }
        return null;
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

  // Provider //
  return (
    <BrowserSidebarContext.Provider
      value={{
        isVisible,
        setVisible,

        attachedDirection,

        isAnimating,
        startAnimation,
        stopAnimation,

        mode: isVisible ? `attached-${attachedDirection}` : "hidden"
      }}
    >
      {children}
    </BrowserSidebarContext.Provider>
  );
}
