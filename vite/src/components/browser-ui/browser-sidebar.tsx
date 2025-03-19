import { Sidebar, SidebarContent, SidebarHeader, SidebarRail, useSidebar } from "@/components/ui/resizable-sidebar";
import { SidebarTabs } from "@/components/browser-ui/sidebar/tabs";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NavigationControls } from "@/components/browser-ui/sidebar/action-buttons";

type CollapseMode = "icon" | "offcanvas";

export function BrowserSidebar() {
  const [collapseMode] = useState<CollapseMode>("icon");

  const { open } = useSidebar();

  return (
    <Sidebar side="left" variant="sidebar" collapsible={collapseMode} className={cn(open && "!border-0")}>
      <SidebarHeader>
        <div className="h-[calc(env(titlebar-area-y)+env(titlebar-area-height)+1px-1.5rem)] w-full app-drag" />
        <NavigationControls />
      </SidebarHeader>
      <SidebarContent>
        <SidebarTabs />
      </SidebarContent>
      <SidebarRail
        className={cn(
          open && "w-1 mr-4",
          open &&
            "after:transition-all after:duration-300 after:ease-in-out after:w-1 after:rounded-full after:h-[95%] after:top-1/2 after:-translate-y-1/2"
        )}
      />
    </Sidebar>
  );
}
