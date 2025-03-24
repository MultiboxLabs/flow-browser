import { Sidebar, SidebarContent, SidebarHeader, SidebarRail, useSidebar } from "@/components/ui/resizable-sidebar";
import { SidebarTabs } from "@/components/browser-ui/sidebar/tabs";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { NavigationControls } from "@/components/browser-ui/sidebar/action-buttons";
import { onToggleSidebar, setWindowButtonPosition } from "@/lib/flow";
import { setWindowButtonVisibility } from "@/lib/flow";
import { CollapseMode, SidebarVariant, SidebarSide } from "@/components/browser-ui/main";
import { SidebarAddressBar } from "@/components/browser-ui/sidebar/address-bar";

type BrowserSidebarProps = {
  collapseMode: CollapseMode;
  variant: SidebarVariant;
  side: SidebarSide;
};

export function BrowserSidebar({ collapseMode, variant, side }: BrowserSidebarProps) {
  const titlebarRef = useRef<HTMLDivElement>(null);

  const { open, toggleSidebar } = useSidebar();

  useEffect(() => {
    setWindowButtonVisibility(open);
  }, [open]);

  // This is to ensure a stable value for the effect.
  const toggleSidebarRef = useRef(toggleSidebar);
  toggleSidebarRef.current = toggleSidebar;
  useEffect(() => {
    const removeListener = onToggleSidebar(() => {
      toggleSidebarRef.current();
    });
    return () => {
      removeListener();
    };
  }, []);

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
            className="platform-darwin:h-[calc(env(titlebar-area-y)+env(titlebar-area-height)+1px-1.5rem)] w-full app-drag"
          />
        )}
        <NavigationControls />
        <SidebarAddressBar />
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
