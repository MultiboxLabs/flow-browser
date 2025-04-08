import BrowserContent from "@/components/browser-ui/browser-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/resizable-sidebar";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { BrowserSidebar } from "@/components/browser-ui/browser-sidebar";
import { SpacesProvider } from "@/components/providers/spaces-provider";

export type CollapseMode = "icon" | "offcanvas";
export type SidebarVariant = "sidebar" | "floating";
export type SidebarSide = "left" | "right";

function InternalBrowserUI() {
  const dynamicTitle: string | null = null;
  const isActiveTabLoading = true;

  return (
    <>
      {dynamicTitle && <title>{`${dynamicTitle} | Flow`}</title>}
      <BrowserSidebar collapseMode="icon" variant="sidebar" side="left" />
      <SidebarInset className="bg-transparent">
        <div
          className={cn(
            "flex-1 flex p-3 platform-win32:pt-[calc(env(titlebar-area-y)+env(titlebar-area-height))] app-drag"
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
  return (
    <div className="w-screen h-screen bg-gradient-to-br from-space-background-start/50 to-space-background-end/50">
      <SidebarProvider>
        <SpacesProvider>
          <InternalBrowserUI />
        </SpacesProvider>
      </SidebarProvider>
    </div>
  );
}
