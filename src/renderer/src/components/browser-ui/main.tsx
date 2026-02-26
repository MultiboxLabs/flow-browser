import { SpacesProvider, useSpaces } from "@/components/providers/spaces-provider";
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
import { memo, useEffect, useRef, useState } from "react";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { ResizablePanelGroupWithProvider } from "@/components/ui/resizable-extras";
import { UpdateEffect } from "@/components/browser-ui/update-effect";
import { AppUpdatesProvider } from "@/components/providers/app-updates-provider";
import {
  TabsProvider,
  useFocusedTab,
  useFocusedTabFullscreen,
  useFocusedTabLoading,
  useTabsGroups
} from "@/components/providers/tabs-provider";
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

// --- Isolated tab-dependent components --- //
// These subscribe to useTabs() independently so the main layout tree
// does NOT rerender on every tab data update (loading, title, url, etc.)

const WindowTitle = memo(function WindowTitle() {
  const focusedTab = useFocusedTab();
  if (!focusedTab?.title) return null;
  return <title>{`${focusedTab.title} | Flow`}</title>;
});

function AutoNewTab({ isReady }: { isReady: boolean }) {
  const { tabGroups } = useTabsGroups();
  const openedNewTabRef = useRef(false);
  useEffect(() => {
    if (isReady && !openedNewTabRef.current) {
      openedNewTabRef.current = true;
      if (tabGroups.length === 0) {
        flow.newTab.open();
      }
    }
  }, [isReady, tabGroups.length]);
  return null;
}

const LoadingIndicator = memo(function LoadingIndicator() {
  const isActiveTabLoading = useFocusedTabLoading();
  const { isCurrentSpaceLight } = useSpaces();

  return (
    <div
      className={cn(
        "absolute -top-2.5 left-0 w-full h-2 flex justify-center items-center z-elevated",
        !isCurrentSpaceLight && "dark"
      )}
    >
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
  );
});

/**
 * Renders BrowserContent alone when the focused tab is fullscreen,
 * otherwise renders children. Uses "children as props" pattern so that
 * tab changes don't cause children to rerender (children refs are stable
 * as long as the parent doesn't rerender).
 */
function FullscreenGuard({ children }: { children: React.ReactNode }) {
  const isFullscreen = useFocusedTabFullscreen();
  if (isFullscreen) {
    // Wrap in a full-screen flex container so BrowserContent's flex-1 works
    // and the measured pageBounds correctly fill the entire window.
    return (
      <div className="w-screen h-screen overflow-hidden flex flex-col">
        <BrowserContent />
      </div>
    );
  }
  return <>{children}</>;
}

function InternalBrowserUI({ isReady, type }: { isReady: boolean; type: BrowserUIType }) {
  // NOTE: No useTabs() here! Tab-dependent logic is isolated in the
  // components above to prevent the entire layout from rerendering.
  const { mode: sidebarMode, setVisible, attachedDirection } = useBrowserSidebar();
  const { topbarVisible, topbarHeight } = useAdaptiveTopbar();

  useEffect(() => {
    // Popup Windows don't have a sidebar
    if (type === "popup") {
      setVisible(false);
    }
  }, [setVisible, type]);

  const hasSidebar = type === "main";

  return (
    <FullscreenGuard>
      <MinimalToastProvider sidebarSide={attachedDirection}>
        <ActionsProvider>
          <WindowTitle />
          <AutoNewTab isReady={isReady} />
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

                    <div className="relative w-full h-full flex flex-col">
                      <LoadingIndicator />
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
    </FullscreenGuard>
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
