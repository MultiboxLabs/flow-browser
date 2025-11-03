import { usePlatform } from "@/components/main/platform";
import { createContext, useContext, useMemo } from "react";

// Context //
interface AdaptiveTopbarContextValue {
  topbarHeight: number;
  topbarVisible: boolean;
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

  const topbarHeight = useMemo<number>(() => {
    if (platform === "win32") {
      return 30;
    }
    return 0;
  }, [platform]);

  const topbarVisible = useMemo<boolean>(() => {
    return topbarHeight > 0;
  }, [topbarHeight]);

  return (
    <AdaptiveTopbarContext.Provider value={{ topbarHeight, topbarVisible }}>{children}</AdaptiveTopbarContext.Provider>
  );
}

// Component //
export function AdaptiveTopbar() {
  const { topbarHeight, topbarVisible } = useAdaptiveTopbar();
  if (!topbarVisible) return null;
  return <div className="w-full" style={{ height: topbarHeight }}></div>;
}
