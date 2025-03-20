import BrowserContent from "@/components/browser-ui/browser-content";
import { BrowserSidebar } from "@/components/browser-ui/browser-sidebar";
import { useBrowser } from "@/components/main/browser-context";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/resizable-sidebar";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type CollapseMode = "icon" | "offcanvas";
export type SidebarVariant = "sidebar" | "floating";
export type SidebarSide = "left" | "right";

function InternalBrowserUI() {
  const { dynamicTitle, activeTab } = useBrowser();
  const [isActiveTabLoading, setIsActiveTabLoading] = useState(false);

  const [collapseMode] = useState<CollapseMode>("icon");
  const [variant] = useState<SidebarVariant>("sidebar");
  const [side] = useState<SidebarSide>("left");

  const { open } = useSidebar();

  useEffect(() => {
    if (activeTab && activeTab.status === "loading") {
      setIsActiveTabLoading(true);
    } else {
      setIsActiveTabLoading(false);
    }
  }, [activeTab]);

  return (
    <>
      {dynamicTitle && <title>{`${dynamicTitle} | Flow`}</title>}
      <BrowserSidebar collapseMode={collapseMode} variant={variant} side={side} />
      <SidebarInset>
        <div className={cn("bg-sidebar flex-1 flex p-3 app-drag", open && "pl-0.5")}>
          {/* Topbar */}
          <div className="absolute top-0 left-0 w-full h-3 flex justify-center items-center">
            {isActiveTabLoading && (
              <div className="w-28 h-1 bg-gray-200/30 dark:bg-white/10 rounded-full overflow-hidden">
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
              </div>
            )}
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
    <SidebarProvider>
      <InternalBrowserUI />
    </SidebarProvider>
  );
}
