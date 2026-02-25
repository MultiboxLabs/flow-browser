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
import { useEffect, useState } from "react";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { ResizablePanelGroupWithProvider } from "@/components/ui/resizable-extras";
import { UpdateEffect } from "@/components/browser-ui/update-effect";
import { AppUpdatesProvider } from "@/components/providers/app-updates-provider";

export type BrowserUIType = "main" | "popup";
export type SidebarVariant = "attached" | "floating";

function SidebarResizeHandle() {
  const [isDown, setIsDown] = useState(false);

  return (
    <div className="w-3 h-full remove-app-drag py-4 px-1 group">
      <ResizableHandle
        className={cn(
          "w-full h-full rounded-full",
          isDown ? "!bg-white/80" : "bg-transparent",
          "group-hover:bg-white/50 transition-[background-color] duration-200"
        )}
        onPointerDown={() => setIsDown(true)}
        onPointerUp={() => setIsDown(false)}
      />
    </div>
  );
}

interface PresenceSidebarProps {
  sidebarMode: BrowserSidebarMode;
  targetSidebarModes: BrowserSidebarMode[];
  direction: AttachedDirection;
  order: number;
}
export function PresenceSidebar({ sidebarMode, targetSidebarModes, direction, order }: PresenceSidebarProps) {
  const shouldRender = targetSidebarModes.includes(sidebarMode);
  const isFloating = sidebarMode.startsWith("floating");
  return (
    <AnimatePresence>
      {shouldRender && (
        <BrowserSidebar
          key="sidebar"
          direction={direction}
          variant={isFloating ? "floating" : "attached"}
          order={order}
        />
      )}
    </AnimatePresence>
  );
}

function InternalBrowserUI({ type }: { type: BrowserUIType }) {
  const { mode: sidebarMode, setVisible } = useBrowserSidebar();
  const { topbarVisible, topbarHeight } = useAdaptiveTopbar();

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
        "bg-linear-to-br from-space-background-start/65 to-space-background-end/65",
        "transition-colors duration-150",
        "flex flex-col",
        "app-drag"
      )}
    >
      <ResizablePanelGroupWithProvider direction="horizontal" className="flex-1 flex flex-col!">
        <AdaptiveTopbar />
        <div
          className={cn("w-full h-[calc(100vh-var(--topbar-height))] flex flex-row items-center justify-center")}
          style={{ "--topbar-height": `${topbarHeight}px` } as React.CSSProperties}
        >
          <PresenceSidebar
            sidebarMode={sidebarMode}
            targetSidebarModes={["attached-left", "floating-left"]}
            direction="left"
            order={1}
          />
          <ResizablePanel id="main" order={2} className={cn("flex-1 h-full py-3", topbarVisible && "pt-0")}>
            <div className="w-full h-full flex items-center justify-center remove-app-drag">
              {sidebarMode !== "attached-left" ? (
                <div className="w-3" />
              ) : (
                <SidebarResizeHandle key="left-sidebar-resize-handle" />
              )}
              <div className="w-full h-full rounded-lg shadow-xl bg-white/20"></div>
              {sidebarMode !== "attached-right" ? (
                <div className="w-3" />
              ) : (
                <SidebarResizeHandle key="right-sidebar-resize-handle" />
              )}
            </div>
          </ResizablePanel>
          <PresenceSidebar
            sidebarMode={sidebarMode}
            targetSidebarModes={["attached-right", "floating-right"]}
            direction="right"
            order={3}
          />
        </div>
      </ResizablePanelGroupWithProvider>

      {/* TODO: Implement update effect */}
      {/* eslint-disable-next-line no-constant-binary-expression */}
      {false && <UpdateEffect />}
    </div>
  );
}

export function BrowserUI({ type }: { type: BrowserUIType }) {
  return (
    <AppUpdatesProvider>
      <SettingsProvider>
        <BrowserSidebarProvider>
          <AdaptiveTopbarProvider>
            <SpacesProvider windowType={type}>
              <InternalBrowserUI type={type} />
            </SpacesProvider>
          </AdaptiveTopbarProvider>
        </BrowserSidebarProvider>
      </SettingsProvider>
    </AppUpdatesProvider>
  );
}
