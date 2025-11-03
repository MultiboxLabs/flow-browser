import { cn } from "@/lib/utils";
import { usePresence } from "motion/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

// Context //
export type AttachedDirection = "left" | "right";
export type BrowserSidebarMode = `attached-${AttachedDirection}` | "floating" | "hidden";
interface BrowserSidebarContextValue {
  isVisible: boolean;
  setVisible: (isVisible: boolean) => void;
  attachedDirection: AttachedDirection;
  setAttachedDirection: (attachedDirection: AttachedDirection) => void;
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
  const [attachedDirection, setAttachedDirection] = useState<AttachedDirection>("right");
  const [isVisible, setVisible] = useState(false);

  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  useEffect(() => {
    const removeListener = flow.interface.onToggleSidebar(() => {
      console.log("toggle sidebar");
      setVisible(!isVisibleRef.current);
    });
    return () => {
      removeListener();
    };
  }, [isVisibleRef, setVisible]);

  return (
    <BrowserSidebarContext.Provider
      value={{
        isVisible,
        setVisible,
        attachedDirection,
        setAttachedDirection,
        mode: isVisible ? `attached-${attachedDirection}` : "hidden"
      }}
    >
      {children}
    </BrowserSidebarContext.Provider>
  );
}

// Component //
function SidebarInner() {
  return <p>Hello Testing</p>;
}

export function BrowserSidebar() {
  const { isVisible, attachedDirection } = useBrowserSidebar();

  // This is needed so that on the first few frames, the width will start from 0 instead of the full width.
  const [isAnimationReady, setAnimationReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAnimationReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const currentlyVisible = isVisible && isAnimationReady;

  const [isPresent, safeToRemove] = usePresence();
  useEffect(() => {
    // Remove from DOM 150ms after being removed from React
    !isPresent && setTimeout(safeToRemove, 150);
  }, [isPresent, safeToRemove]);

  return (
    <div
      className={cn(
        "h-full overflow-hidden",
        "transition-[width] duration-150 ease-in-out",
        currentlyVisible ? "w-[20%]" : "w-0"
      )}
    >
      <div
        className={cn(
          "w-[20vw] h-full",
          "transition-transform duration-150 ease-in-out",
          "flex flex-col",
          currentlyVisible && attachedDirection === "left" ? "translate-x-0" : "-translate-x-full",
          currentlyVisible && attachedDirection === "right" ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className={cn("m-4 flex-1", "flex flex-col")}>
          <SidebarInner />
        </div>
      </div>
    </div>
  );
}
