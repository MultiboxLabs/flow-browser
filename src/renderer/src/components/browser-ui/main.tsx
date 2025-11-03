import { SpacesProvider } from "@/components/providers/spaces-provider";
import { cn } from "@/lib/utils";
import { AdaptiveTopbar, AdaptiveTopbarProvider, useAdaptiveTopbar } from "@/components/browser-ui/adaptive-topbar";
import {
  BrowserSidebar,
  type BrowserSidebarMode,
  BrowserSidebarProvider,
  useBrowserSidebar
} from "@/components/browser-ui/browser-sidebar";
import { AnimatePresence } from "motion/react";
import { useEffect } from "react";

export type BrowserUIType = "main" | "popup";

interface PresenceSidebarProps {
  sidebarMode: BrowserSidebarMode;
  targetSidebarMode: BrowserSidebarMode;
}
export function PresenceSidebar({ sidebarMode, targetSidebarMode }: PresenceSidebarProps) {
  return <AnimatePresence>{sidebarMode === targetSidebarMode && <BrowserSidebar key="sidebar" />}</AnimatePresence>;
}

function InternalBrowserUI({ type }: { type: BrowserUIType }) {
  const { mode: sidebarMode, setVisible } = useBrowserSidebar();
  const { topbarVisible } = useAdaptiveTopbar();

  useEffect(() => {
    // Popup Windows don't have a sidebar
    if (type === "popup") {
      setVisible(false);
    }
  }, [type]);

  return (
    <div
      className={cn(
        "w-screen h-screen",
        "bg-gradient-to-br from-space-background-start/75 to-space-background-end/75",
        "flex flex-col",
        "app-drag"
      )}
    >
      <AdaptiveTopbar />
      <div className="flex-1 w-full flex flex-row items-center justify-center">
        <PresenceSidebar sidebarMode={sidebarMode} targetSidebarMode="attached-left" />
        <div
          className={cn(
            "flex-1 h-full p-3 transition-[padding] duration-150 ease-in-out",
            topbarVisible && "pt-0",
            sidebarMode === "attached-left" ? "pl-0" : "pl-3",
            sidebarMode === "attached-right" ? "pr-0" : "pr-3"
          )}
        >
          <div className="w-full h-full flex items-center justify-center remove-app-drag">
            <div className="w-full h-full rounded-lg shadow-xl bg-white/20"></div>
          </div>
        </div>
        <PresenceSidebar sidebarMode={sidebarMode} targetSidebarMode="attached-right" />
      </div>
    </div>
  );
}

export function BrowserUI({ type }: { type: BrowserUIType }) {
  return (
    <AdaptiveTopbarProvider>
      <BrowserSidebarProvider>
        <SpacesProvider windowType={type}>
          <InternalBrowserUI type={type} />
        </SpacesProvider>
      </BrowserSidebarProvider>
    </AdaptiveTopbarProvider>
  );
}
