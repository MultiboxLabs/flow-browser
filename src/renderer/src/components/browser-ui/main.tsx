import { SpacesProvider } from "@/components/providers/spaces-provider";
import { cn } from "@/lib/utils";
import { AdaptiveTopbar, AdaptiveTopbarProvider, useAdaptiveTopbar } from "@/components/browser-ui/adaptive-topbar";
import { useMemo } from "react";
import { BrowserSidebar } from "@/components/browser-ui/browser-sidebar";

export type BrowserUIType = "main" | "popup";

function InternalBrowserUI({ type }: { type: BrowserUIType }) {
  // Temporary sidebar mode logic for testing
  const sidebarMode: "attached-left" | "attached-right" | "floating" | "hidden" = useMemo(() => {
    if (type === "main") {
      return "attached-left";
    }
    return "attached-right";
  }, [type]);

  const { topbarVisible } = useAdaptiveTopbar();

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
        {sidebarMode === "attached-left" && <BrowserSidebar />}
        <div
          className={cn(
            "flex-1 h-full p-3",
            topbarVisible && "pt-0",
            sidebarMode === "attached-left" ? "pl-0" : "pl-3",
            sidebarMode === "attached-right" ? "pr-0" : "pr-3"
          )}
        >
          <div className="w-full h-full flex items-center justify-center remove-app-drag">
            <div className="w-full h-full rounded-lg shadow-xl bg-white/20"></div>
          </div>
        </div>
        {sidebarMode === "attached-right" && <BrowserSidebar />}
      </div>
    </div>
  );
}

export function BrowserUI({ type }: { type: BrowserUIType }) {
  return (
    <AdaptiveTopbarProvider>
      <SpacesProvider windowType={type}>
        <InternalBrowserUI type={type} />
      </SpacesProvider>
    </AdaptiveTopbarProvider>
  );
}
