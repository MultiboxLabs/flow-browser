import { SpacesProvider } from "@/components/providers/spaces-provider";
import { cn } from "@/lib/utils";
import { AdaptiveTopbar, AdaptiveTopbarProvider, useAdaptiveTopbar } from "@/components/browser-ui/adaptive-topbar";
import {
  type BrowserSidebarMode,
  type AttachedDirection,
  BrowserSidebarProvider,
  useBrowserSidebar
} from "@/components/browser-ui/browser-sidebar/provider";
import { BrowserSidebar } from "@/components/browser-ui/browser-sidebar/component";
import { AnimatePresence } from "motion/react";
import { useEffect } from "react";
import { SettingsProvider } from "@/components/providers/settings-provider";

export type BrowserUIType = "main" | "popup";
export type SidebarVariant = "attached" | "floating";

interface PresenceSidebarProps {
  sidebarMode: BrowserSidebarMode;
  targetSidebarModes: BrowserSidebarMode[];
  direction: AttachedDirection;
}
export function PresenceSidebar({ sidebarMode, targetSidebarModes, direction }: PresenceSidebarProps) {
  return (
    <AnimatePresence>
      {targetSidebarModes.includes(sidebarMode) && (
        <BrowserSidebar
          key="sidebar"
          direction={direction}
          variant={sidebarMode.startsWith("floating") ? "floating" : "attached"}
        />
      )}
    </AnimatePresence>
  );
}

function InternalBrowserUI({ type }: { type: BrowserUIType }) {
  const { mode: sidebarMode, setVisible } = useBrowserSidebar();
  const { topbarVisible } = useAdaptiveTopbar();

  useEffect(() => {
    // Popup Windows don't have a sidebar
    if (type === "popup") {
      setVisible(false);
    }
  }, [setVisible, type]);

  return (
    <div
      className={cn(
        "w-screen h-screen overflow-hidden",
        "bg-gradient-to-br from-space-background-start/75 to-space-background-end/75",
        "flex flex-col",
        "app-drag"
      )}
    >
      <AdaptiveTopbar />
      <div className="flex-1 w-full flex flex-row items-center justify-center">
        <PresenceSidebar
          sidebarMode={sidebarMode}
          targetSidebarModes={["attached-left", "floating-left"]}
          direction="left"
        />
        <div className={cn("flex-1 h-full p-3", topbarVisible && "pt-0")}>
          <div className="w-full h-full flex items-center justify-center remove-app-drag">
            <div className="w-full h-full rounded-lg shadow-xl bg-white/20"></div>
          </div>
        </div>
        <PresenceSidebar
          sidebarMode={sidebarMode}
          targetSidebarModes={["attached-right", "floating-right"]}
          direction="right"
        />
      </div>
    </div>
  );
}

export function BrowserUI({ type }: { type: BrowserUIType }) {
  return (
    <SettingsProvider>
      <BrowserSidebarProvider>
        <AdaptiveTopbarProvider>
          <SpacesProvider windowType={type}>
            <InternalBrowserUI type={type} />
          </SpacesProvider>
        </AdaptiveTopbarProvider>
      </BrowserSidebarProvider>
    </SettingsProvider>
  );
}
