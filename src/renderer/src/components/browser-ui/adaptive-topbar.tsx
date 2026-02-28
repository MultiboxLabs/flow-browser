import { useBrowserSidebar } from "@/components/browser-ui/browser-sidebar/provider";
import { SidebarWindowControlsMacOS } from "@/components/browser-ui/window-controls/macos";
import { usePlatform } from "@/components/main/platform";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Context //
interface AdaptiveTopbarContextValue {
  topbarHeight: number;
  topbarVisible: boolean;
  isFullscreen: boolean;
  /** Extra vertical space consumed by renderer-only UI above the content (e.g. popup toolbar). */
  contentTopOffset: number;
  setContentTopOffset: (offset: number) => void;
}

const AdaptiveTopbarContext = createContext<AdaptiveTopbarContextValue | null>(null);

export const useAdaptiveTopbar = () => {
  const context = useContext(AdaptiveTopbarContext);
  if (!context) {
    throw new Error("useAdaptiveTopbar must be used within an AdaptiveTopbarProvider");
  }
  return context;
};

interface AdaptiveTopbarProviderProps {
  children: React.ReactNode;
}

export function AdaptiveTopbarProvider({ children }: AdaptiveTopbarProviderProps) {
  const { platform } = usePlatform();
  const { attachedDirection } = useBrowserSidebar();

  const topbarHeight = useMemo<number>(() => {
    if (platform === "win32") {
      return 30;
    }

    // The macOS Window Controls are on the left side, so we will add a padding for it if the sidebar is on the right side.
    if (platform === "darwin" && attachedDirection === "right") {
      return 34;
    }

    return 0;
  }, [platform, attachedDirection]);

  const topbarVisible = topbarHeight > 0;

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    let updated = false;
    flow.interface.getWindowState().then((state) => {
      if (!updated) {
        setIsFullscreen(state.isFullscreen);
      }
    });
    const removeListener = flow.interface.onWindowStateChanged((state) => {
      setIsFullscreen(state.isFullscreen);
      updated = true;
    });
    return () => {
      removeListener();
    };
  }, []);

  const currentlyVisible = !isFullscreen && topbarVisible;

  const [contentTopOffset, setContentTopOffsetRaw] = useState(0);
  const setContentTopOffset = useCallback((offset: number) => {
    setContentTopOffsetRaw((prev) => (prev === offset ? prev : offset));
  }, []);

  return (
    <AdaptiveTopbarContext.Provider
      value={{ topbarHeight, topbarVisible: currentlyVisible, isFullscreen, contentTopOffset, setContentTopOffset }}
    >
      {children}
    </AdaptiveTopbarContext.Provider>
  );
}

// Component //
export function AdaptiveTopbar() {
  const { topbarHeight, topbarVisible, isFullscreen } = useAdaptiveTopbar();
  if (!topbarVisible) return null;
  if (isFullscreen) return null;
  return (
    <div className="w-full flex flex-row items-center" style={{ height: `${topbarHeight}px` }}>
      <div className="w-3" />
      <SidebarWindowControlsMacOS />
    </div>
  );
}
