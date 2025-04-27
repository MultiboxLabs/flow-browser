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
import { useEffect, useRef, Fragment, useState } from "react";
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
import { motion, AnimatePresence } from "motion/react";

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

  // Determine if the core sidebar content (potentially animated) should be rendered
  const shouldRenderAnimatedContent = open || variant !== "floating";

  // State to keep the outer wrapper (Portal or Fragment) mounted during exit animations,
  // ensuring the component remains in the DOM for AnimatePresence to work correctly.
  const [isWrapperMounted, setIsWrapperMounted] = useState(shouldRenderAnimatedContent);

  const themeClasses = cn(isCurrentSpaceLight ? "" : "dark");

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

  // Update isWrapperMounted immediately if we need to show the component.
  // This ensures the wrapper is mounted *before* the animation starts.
  useEffect(() => {
    if (shouldRenderAnimatedContent) {
      setIsWrapperMounted(true);
    }
  }, [shouldRenderAnimatedContent]);

  // Callback function triggered after the exit animation completes.
  const handleExitComplete = () => {
    // Only unmount the wrapper if the content is no longer supposed to be rendered.
    // This prevents the wrapper from disappearing prematurely if the sidebar
    // is quickly toggled open again during the exit animation.
    if (!shouldRenderAnimatedContent) {
      setIsWrapperMounted(false);
    }
  };

  // Define the wrapper component based on the variant.
  // Use Portal for floating variant to render outside the normal DOM hierarchy.
  // Use Fragment for other variants.
  const WrapperComponent = variant === "floating" ? PortalComponent : Fragment;
  // Define the motion component based on the variant.
  // Use motion.div for floating variant to enable animations.
  // Use Fragment for other variants (no animation needed).
  const MotionComponent = variant === "floating" ? motion.div : Fragment;
  const sideOffset = side === "left" ? -300 : 300;

  return (
    <>
      {/* Only render the wrapper (and its children) if isWrapperMounted is true.
          This state persists through the exit animation. */}
      {isWrapperMounted && (
        <WrapperComponent x={0} y={0} width={width} height="100%">
          {/* Optional: Add a backdrop for floating variant */}
          {/* {variant === "floating" && <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />} */}
          <AnimatePresence onExitComplete={handleExitComplete}>
            {/* Conditionally render the animated content based on the calculated state */}
            {shouldRenderAnimatedContent && (
              <MotionComponent
                key="sidebar-motion" // Necessary for AnimatePresence to track the component
                initial={{ x: sideOffset, originX: side === "left" ? 0 : 1 }}
                animate={{ x: 0 }}
                exit={{ x: sideOffset }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                // Apply position and dimensions only for the animated (floating) variant
                style={
                  variant === "floating" ? { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" } : {}
                }
              >
                <Sidebar
                  side={side}
                  variant={variant}
                  collapsible={collapseMode}
                  className={cn(
                    "select-none",
                    "!border-0",
                    "*:bg-transparent",
                    variant === "floating" && "!w-full !flex *:bg-space-background-start"
                  )}
                >
                  <SidebarHeader className={cn(themeClasses, "pb-0 gap-0")}>
                    {open && <SidebarWindowControls />}
                    <NavigationControls />
                    <SidebarAddressBar />
                  </SidebarHeader>
                  <ScrollableSidebarContent />
                  <SidebarFooter className={cn(themeClasses)}>
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
                      "w-1",
                      variant === "sidebar" && (side === "left" ? "mr-4" : "ml-4"),
                      variant === "floating" && (side === "left" ? "mr-6" : "ml-6"),
                      "after:transition-all after:duration-300 after:ease-in-out after:w-1 after:rounded-full after:h-[95%] after:top-1/2 after:-translate-y-1/2"
                    )}
                  />
                </Sidebar>
              </MotionComponent>
            )}
          </AnimatePresence>
        </WrapperComponent>
      )}
    </>
  );
}
