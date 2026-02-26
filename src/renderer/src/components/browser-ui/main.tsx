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
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { ResizablePanelGroupWithProvider } from "@/components/ui/resizable-extras";
import { UpdateEffect } from "@/components/browser-ui/update-effect";
import { AppUpdatesProvider } from "@/components/providers/app-updates-provider";
import { TabsProvider, useTabs } from "@/components/providers/tabs-provider";
import { TabDisabler } from "@/components/logic/tab-disabler";
import { BrowserActionProvider } from "@/components/providers/browser-action-provider";
import { ExtensionsProviderWithSpaces } from "@/components/providers/extensions-provider";
import MinimalToastProvider from "@/components/providers/minimal-toast-provider";
import { ActionsProvider } from "@/components/providers/actions-provider";
import BrowserContent from "@/components/browser-ui/browser-content";

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

function InternalBrowserUI({ isReady, type }: { isReady: boolean; type: BrowserUIType }) {
  const { mode: sidebarMode, setVisible, attachedDirection } = useBrowserSidebar();
  const { topbarVisible, topbarHeight } = useAdaptiveTopbar();
  const { focusedTab, tabGroups } = useTabs();

  useEffect(() => {
    // Popup Windows don't have a sidebar
    if (type === "popup") {
      setVisible(false);
    }
  }, [setVisible, type]);

  // Dynamic window title based on focused tab
  const dynamicTitle: string | null = useMemo(() => {
    if (!focusedTab) return null;
    return focusedTab.title;
  }, [focusedTab]);

  // Auto-open new tab if no tabs exist when ready
  const openedNewTabRef = useRef(false);
  useEffect(() => {
    if (isReady && !openedNewTabRef.current) {
      openedNewTabRef.current = true;
      if (tabGroups.length === 0) {
        flow.newTab.open();
      }
    }
  }, [isReady, tabGroups.length]);

  const isActiveTabLoading = focusedTab?.isLoading || false;

  const hasSidebar = type === "main";

  // Fullscreen: render only the browser content
  if (focusedTab?.fullScreen) {
    return <BrowserContent />;
  }

  return (
    <MinimalToastProvider sidebarSide={attachedDirection}>
      <ActionsProvider>
        {dynamicTitle && <title>{`${dynamicTitle} | Flow`}</title>}
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
              {hasSidebar && (
                <PresenceSidebar
                  sidebarMode={sidebarMode}
                  targetSidebarModes={["attached-left", "floating-left"]}
                  direction="left"
                  order={1}
                />
              )}
              <ResizablePanel id="main" order={2} className={cn("flex-1 h-full py-3", topbarVisible && "pt-0")}>
                <div className="w-full h-full flex items-center justify-center remove-app-drag">
                  {sidebarMode !== "attached-left" ? (
                    <div className="w-3" />
                  ) : (
                    <SidebarResizeHandle key="left-sidebar-resize-handle" />
                  )}

                  {/* Loading Indicator */}
                  <div className="relative w-full h-full flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-2 flex justify-center items-center z-10">
                      <AnimatePresence>
                        {isActiveTabLoading && (
                          <motion.div
                            className="w-28 h-1 bg-gray-200/30 dark:bg-white/10 rounded-full overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <motion.div
                              className="h-full bg-gray-800/90 dark:bg-white/90 rounded-full"
                              initial={{ x: "-100%" }}
                              animate={{ x: "100%" }}
                              transition={{
                                duration: 1,
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: 0.1
                              }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <BrowserContent />
                  </div>

                  {sidebarMode !== "attached-right" ? (
                    <div className="w-3" />
                  ) : (
                    <SidebarResizeHandle key="right-sidebar-resize-handle" />
                  )}
                </div>
              </ResizablePanel>
              {hasSidebar && (
                <PresenceSidebar
                  sidebarMode={sidebarMode}
                  targetSidebarModes={["attached-right", "floating-right"]}
                  direction="right"
                  order={3}
                />
              )}
            </div>
          </ResizablePanelGroupWithProvider>

          {/* TODO: Implement update effect */}
          {/* eslint-disable-next-line no-constant-binary-expression */}
          {false && <UpdateEffect />}
        </div>
      </ActionsProvider>
    </MinimalToastProvider>
  );
}

export function BrowserUI({ type }: { type: BrowserUIType }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsReady(true);
    }, 100);
  }, []);

  return (
    <AppUpdatesProvider>
      <SettingsProvider>
        <BrowserSidebarProvider>
          <AdaptiveTopbarProvider>
            <SpacesProvider windowType={type}>
              <TabsProvider>
                <BrowserActionProvider>
                  <ExtensionsProviderWithSpaces>
                    <TabDisabler />
                    <InternalBrowserUI isReady={isReady} type={type} />
                  </ExtensionsProviderWithSpaces>
                </BrowserActionProvider>
              </TabsProvider>
            </SpacesProvider>
          </AdaptiveTopbarProvider>
        </BrowserSidebarProvider>
      </SettingsProvider>
    </AppUpdatesProvider>
  );
}
