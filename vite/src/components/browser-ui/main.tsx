import BrowserContent from "@/components/browser-ui/browser-content";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/resizable-sidebar";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { BrowserSidebar } from "@/components/browser-ui/browser-sidebar";
import { SpacesProvider } from "@/components/providers/spaces-provider";
import { useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { TabsProvider, useTabs } from "@/components/providers/tabs-provider";
import { SettingsProvider, useSettings } from "@/components/providers/settings-provider";
import { TabDisabler } from "@/components/logic/tab-disabler";
import { BrowserActionProvider } from "@/components/providers/browser-action-provider";
import { ExtensionsProviderWithSpaces } from "@/components/providers/extensions-provider";

export type CollapseMode = "icon" | "offcanvas";
export type SidebarVariant = "sidebar" | "floating";
export type SidebarSide = "left" | "right";

export type WindowType = "main" | "popup";

function InternalBrowserUI({ isReady, type }: { isReady: boolean; type: WindowType }) {
  const { open } = useSidebar();
  const { getSetting } = useSettings();
  const { focusedTab, tabGroups } = useTabs();

  const sidebarCollapseMode = getSetting<CollapseMode>("sidebarCollapseMode");

  const dynamicTitle: string | null = useMemo(() => {
    if (!focusedTab) return null;

    return focusedTab.title;
  }, [focusedTab]);

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

  // Only show the browser content if the focused tab is in full screen mode
  if (focusedTab?.fullScreen) {
    return <BrowserContent />;
  }

  const hasSidebar = type === "main";

  return (
    <>
      {dynamicTitle && <title>{`${dynamicTitle} | Flow`}</title>}
      {hasSidebar && <BrowserSidebar collapseMode={sidebarCollapseMode} variant="sidebar" side="left" />}
      <SidebarInset className="bg-transparent">
        <div
          className={cn(
            "dark flex-1 flex p-2.5 platform-win32:pt-[calc(env(titlebar-area-y)+env(titlebar-area-height))] app-drag",
            open && hasSidebar && "pl-0.5",
            type === "popup" && "pt-[calc(env(titlebar-area-y)+env(titlebar-area-height))]"
          )}
        >
          {/* Topbar */}
          <div className="absolute top-0 left-0 w-full h-2.5 flex justify-center items-center">
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

          {/* Content */}
          <BrowserContent />
        </div>
      </SidebarInset>
    </>
  );
}

export function BrowserUI({ type }: { type: WindowType }) {
  const [isReady, setIsReady] = useState(false);

  // No transition on first load
  useEffect(() => {
    setTimeout(() => {
      setIsReady(true);
    }, 100);
  }, []);

  return (
    <div
      className={cn(
        "w-screen h-screen",
        "bg-gradient-to-br from-space-background-start/60 to-space-background-end/60",
        isReady && "transition-colors duration-300"
      )}
    >
      <TabDisabler />
      <SidebarProvider>
        <SettingsProvider>
          <SpacesProvider windowType={type}>
            <TabsProvider>
              <BrowserActionProvider>
                <ExtensionsProviderWithSpaces>
                  <InternalBrowserUI isReady={isReady} type={type} />
                </ExtensionsProviderWithSpaces>
              </BrowserActionProvider>
            </TabsProvider>
          </SpacesProvider>
        </SettingsProvider>
      </SidebarProvider>
    </div>
  );
}
