import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from "@/components/ui/resizable-sidebar";
import { SidebarTabs } from "@/components/browser-ui/sidebar/tabs";
import { useState } from "react";
import { cn } from "@/lib/utils";

type CollapseMode = "icon" | "offcanvas";

export function BrowserSidebar() {
  const [collapseMode] = useState<CollapseMode>("icon");

  const { open } = useSidebar();

  return (
    <Sidebar side="left" variant="sidebar" collapsible={collapseMode} className={cn(open && "!border-0")}>
      <SidebarHeader>
        <div className="h-[calc(env(titlebar-area-y)+env(titlebar-area-height)+1px-1rem)] w-full app-drag" />
        <SidebarMenu>
          <SidebarMenuItem>Flow Browser</SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarTabs />
      </SidebarContent>
      <SidebarRail
        className={cn(
          "w-1 mr-4",
          "after:transition-all after:duration-300 after:ease-in-out after:w-1 after:rounded-full after:h-[95%] after:top-1/2 after:-translate-y-1/2"
        )}
      />
    </Sidebar>
  );
}
