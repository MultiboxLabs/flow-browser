import { Sidebar, SidebarContent, SidebarHeader, SidebarRail, useSidebar } from "@/components/ui/resizable-sidebar";
import { SidebarTabs } from "@/components/browser-ui/sidebar/tabs";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { NavigationControls } from "@/components/browser-ui/sidebar/action-buttons";
import { setWindowButtonPosition } from "@/lib/flow";
import { setWindowButtonVisibility } from "@/lib/flow";

type CollapseMode = "icon" | "offcanvas";
type SidebarVariant = "sidebar" | "floating";
type SidebarSide = "left" | "right";

export function BrowserSidebar() {
  const [collapseMode] = useState<CollapseMode>("icon");
  const [variant] = useState<SidebarVariant>("sidebar");
  const [side] = useState<SidebarSide>("left");
  const titlebarRef = useRef<HTMLDivElement>(null);

  const { open } = useSidebar();

  useEffect(() => {
    setWindowButtonVisibility(open);
  }, [open]);

  useEffect(() => {
    const titlebar = titlebarRef.current;
    if (titlebar) {
      const titlebarBounds = titlebar.getBoundingClientRect();
      setWindowButtonPosition({
        x: titlebarBounds.x,
        y: titlebarBounds.y
      });
    }
  }, [variant]);

  return (
    <Sidebar
      side={side}
      variant={variant}
      collapsible={collapseMode}
      className={cn(open && "!border-0", variant === "floating" && "bg-sidebar")}
    >
      <SidebarHeader>
        {open && (
          <div
            ref={titlebarRef}
            className="h-[calc(env(titlebar-area-y)+env(titlebar-area-height)+1px-1.5rem)] w-full app-drag"
          />
        )}
        <NavigationControls />
      </SidebarHeader>
      <SidebarContent>
        <SidebarTabs />
      </SidebarContent>
      <SidebarRail
        className={cn(
          open && "w-1",
          open && variant === "sidebar" && (side === "left" ? "mr-4" : "ml-4"),
          open && variant === "floating" && (side === "left" ? "mr-6" : "ml-6"),
          !open && variant === "floating" && (side === "left" ? "mr-1.5" : "ml-1.5"),
          open &&
            "after:transition-all after:duration-300 after:ease-in-out after:w-1 after:rounded-full after:h-[95%] after:top-1/2 after:-translate-y-1/2"
        )}
      />
    </Sidebar>
  );
}
