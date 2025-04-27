import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from "@/components/ui/resizable-sidebar";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CollapseMode, SidebarVariant, SidebarSide } from "@/components/browser-ui/main";
import { PlusIcon, SettingsIcon } from "lucide-react";
import { SidebarSpacesSwitcher } from "@/components/browser-ui/sidebar/spaces-switcher";
import { ScrollableSidebarContent } from "@/components/browser-ui/sidebar/content/sidebar-content";
import { useSpaces } from "@/components/providers/spaces-provider";
import { NavigationControls } from "@/components/browser-ui/sidebar/header/action-buttons";
import { SidebarAddressBar } from "@/components/browser-ui/sidebar/header/address-bar/address-bar";
import { PortalComponent } from "@/components/portal/portal";
import { SidebarWindowControls } from "@/components/browser-ui/sidebar/header/window-controls";

type BrowserSidebarProps = {
  collapseMode: CollapseMode;
  variant: SidebarVariant;
  side: SidebarSide;
};

export const SIDEBAR_HOVER_COLOR =
  "hover:bg-black/10 active:bg-black/15 dark:hover:bg-white/10 dark:active:bg-white/15";

export function BrowserSidebar({ collapseMode, variant, side }: BrowserSidebarProps) {
  const { open, toggleSidebar, width } = useSidebar();
  const { isCurrentSpaceLight } = useSpaces();

  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");

  const toggleSidebarRef = useRef(toggleSidebar);
  toggleSidebarRef.current = toggleSidebar;
  useEffect(() => {
    const removeListener = flow.interface.onToggleSidebar(() => {
      toggleSidebarRef.current();
    });
    return () => {
      removeListener();
    };
  }, []);

  if (!open) return null;

  return (
    <PortalComponent x={0} y={0} width={width} height={"100%"}>
      <Sidebar
        side={side}
        variant={variant}
        collapsible={collapseMode}
        className={cn(
          "select-none",
          open && "!border-0",
          "*:bg-transparent",
          "!w-full !flex *:bg-space-background-start"
        )}
      >
        <SidebarHeader className={cn(spaceInjectedClasses, "pb-0 gap-0")}>
          {open && <SidebarWindowControls />}
          <NavigationControls />
          <SidebarAddressBar />
        </SidebarHeader>
        <ScrollableSidebarContent />
        <SidebarFooter className={cn(spaceInjectedClasses)}>
          {open && (
            <SidebarMenu className="flex flex-row justify-between">
              {/* Left Side Buttons */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(SIDEBAR_HOVER_COLOR, "text-black dark:text-white")}
                  onClick={() => flow.windows.openSettingsWindow()}
                >
                  <SettingsIcon />
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Middle (Spaces) */}
              <SidebarSpacesSwitcher />
              {/* Right Side Buttons */}
              <SidebarMenuItem>
                <SidebarMenuButton disabled className={cn(SIDEBAR_HOVER_COLOR, "text-black dark:text-white")}>
                  <PlusIcon />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
        <SidebarRail
          className={cn(
            "dark",
            open && "w-1",
            open && variant === "sidebar" && (side === "left" ? "mr-4" : "ml-4"),
            open && variant === "floating" && (side === "left" ? "mr-6" : "ml-6"),
            !open && variant === "floating" && (side === "left" ? "mr-1.5" : "ml-1.5"),
            open &&
              "after:transition-all after:duration-300 after:ease-in-out after:w-1 after:rounded-full after:h-[95%] after:top-1/2 after:-translate-y-1/2"
          )}
        />
      </Sidebar>
    </PortalComponent>
  );
}
