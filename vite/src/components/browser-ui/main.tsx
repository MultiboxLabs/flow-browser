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

export type CollapseMode = "icon" | "offcanvas";
export type SidebarVariant = "sidebar" | "floating";
export type SidebarSide = "left" | "right";

function InternalBrowserUI({ isReady }: { isReady: boolean }) {
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

  return (
    <>
      {dynamicTitle && <title>{`${dynamicTitle} | Flow`}</title>}
      <BrowserSidebar collapseMode={sidebarCollapseMode} variant="sidebar" side="left" />
      <SidebarInset className="bg-transparent">
        <div
          className={cn(
            "dark flex-1 flex p-2.5 platform-win32:pt-[calc(env(titlebar-area-y)+env(titlebar-area-height))] app-drag",
            open && "pl-1"
          )}
        >
          {/* Topbar */}
          <div className="absolute top-0 left-0 w-full h-3 flex justify-center items-center">
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

export function BrowserUI() {
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
          <SpacesProvider>
            <TabsProvider>
              <InternalBrowserUI isReady={isReady} />
            </TabsProvider>
          </SpacesProvider>
        </SettingsProvider>
      </SidebarProvider>
    </div>
  );
}
