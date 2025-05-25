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
import { useEffect, useRef, useState, useCallback } from "react";
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
import { SidebarFooterUpdate } from "@/components/browser-ui/sidebar/footer/update";

type BrowserSidebarProps = {
  collapseMode: CollapseMode;
  variant: SidebarVariant;
  side: SidebarSide;
  setIsHoveringSidebar: (isHovering: boolean) => void;
  setVariant: (variant: SidebarVariant) => void;
};

export const SIDEBAR_HOVER_COLOR =
  "hover:bg-black/10 active:bg-black/15 dark:hover:bg-white/10 dark:active:bg-white/15";
export const SIDEBAR_HOVER_COLOR_PLAIN = "bg-black/10 dark:bg-white/10";

// Custom hook to handle sidebar animation mounting logic
function useSidebarAnimation(shouldRenderContent: boolean, setVariant: (variant: SidebarVariant) => void) {
  const [isWrapperMounted, setIsWrapperMounted] = useState(shouldRenderContent);

  useEffect(() => {
    if (shouldRenderContent) {
      setIsWrapperMounted(true);
    }
  }, [shouldRenderContent]);

  const handleExitComplete = useCallback(() => {
    if (!shouldRenderContent) {
      setIsWrapperMounted(false);
      setVariant("sidebar");
    }
  }, [shouldRenderContent, setVariant]);

  return { isWrapperMounted, handleExitComplete };
}

// Custom hook to handle sidebar hover state
function useSidebarHover(setIsHoveringSidebar: (isHovering: boolean) => void) {
  const isHoveringSidebarRef = useRef(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    isHoveringSidebarRef.current = true;
    timeoutIdRef.current = setTimeout(() => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (isHoveringSidebarRef.current) {
        setIsHoveringSidebar(true);
      }
    }, 100);
  }, [setIsHoveringSidebar]);

  const handleMouseLeave = useCallback(() => {
    isHoveringSidebarRef.current = false;
    timeoutIdRef.current = setTimeout(() => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (!isHoveringSidebarRef.current) {
        setIsHoveringSidebar(false);
      }
    }, 100);
  }, [setIsHoveringSidebar]);

  return { handleMouseEnter, handleMouseLeave };
}

// Component for the sidebar footer content
function SidebarFooterContent() {
  return (
    <>
      <SidebarFooterUpdate />
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
    </>
  );
}

// Component for the sidebar header content
function SidebarHeaderContent({ open, themeClasses }: { open: boolean; themeClasses: string }) {
  return (
    <SidebarHeader className={cn(themeClasses, "pb-0 gap-0")}>
      {open && <SidebarWindowControls />}
      <NavigationControls />
      <SidebarAddressBar />
    </SidebarHeader>
  );
}

// Component that renders the sidebar content
function SidebarContent({
  open,
  side,
  variant,
  collapseMode,
  themeClasses,
  handleMouseEnter,
  handleMouseLeave,
  sidebarClassNames,
  railClassNames
}: {
  open: boolean;
  side: SidebarSide;
  variant: SidebarVariant;
  collapseMode: CollapseMode;
  themeClasses: string;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  sidebarClassNames: string;
  railClassNames: string;
}) {
  return (
    <Sidebar
      side={side}
      variant={variant}
      collapsible={collapseMode}
      className={sidebarClassNames}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeaderContent open={open} themeClasses={themeClasses} />
      <ScrollableSidebarContent />
      <SidebarFooter className={themeClasses}>{open && <SidebarFooterContent />}</SidebarFooter>
      <SidebarRail className={railClassNames} isRightSide={side === "right"} />
    </Sidebar>
  );
}

export function BrowserSidebar({ collapseMode, variant, side, setIsHoveringSidebar, setVariant }: BrowserSidebarProps) {
  const { open, toggleSidebar, width } = useSidebar();
  const { isCurrentSpaceLight } = useSpaces();

  // Determine if the core sidebar content should be rendered
  const shouldRenderAnimatedContent = open || variant !== "floating";

  const themeClasses = cn(isCurrentSpaceLight ? "" : "dark");

  // Use custom hooks for animation and hover state
  const { isWrapperMounted, handleExitComplete } = useSidebarAnimation(shouldRenderAnimatedContent, setVariant);
  const { handleMouseEnter, handleMouseLeave } = useSidebarHover(setIsHoveringSidebar);

  useEffect(() => {
    const removeListener = flow.interface.onToggleSidebar(() => {
      if (variant === "floating") {
        setVariant("sidebar");
      } else {
        toggleSidebar();
      }
    });
    return () => {
      removeListener();
    };
  }, [toggleSidebar, variant, setVariant]);

  // Animation properties
  const sideOffset = side === "left" ? `-${width}` : `${width}`;
  const animationProps = {
    initial: { x: sideOffset, originX: side === "left" ? 0 : 1 },
    animate: { x: 0 },
    exit: { x: sideOffset },
    transition: { type: "spring", damping: 30, stiffness: 400 }
  };

  // Style for floating variant
  const floatingStyle =
    variant === "floating"
      ? {
          position: "absolute" as const,
          top: 0 as const,
          left: 0 as const,
          width: "100%" as const,
          height: "100%" as const
        }
      : {};

  // Sidebar class names
  const sidebarClassNames = cn(
    "select-none",
    "!border-0",
    "*:bg-transparent",
    variant === "floating" && "!w-full !flex *:dimmed-space-background-start"
  );

  // Rail class names
  const railClassNames = cn(
    "dark",
    "w-1",
    variant === "sidebar" && "mr-4",
    variant === "floating" && (side === "left" ? "mr-6" : "ml-6"),
    "after:transition-all after:duration-300 after:ease-in-out after:w-1 after:rounded-full after:h-[95%] after:top-1/2 after:-translate-y-1/2"
  );

  if (!isWrapperMounted) {
    return null;
  }

  // Create the sidebar content element
  const sidebarContent = (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {shouldRenderAnimatedContent && (
        <motion.div
          key="sidebar-motion"
          {...(variant === "floating" ? animationProps : {})}
          style={variant === "floating" ? floatingStyle : undefined}
        >
          <SidebarContent
            open={open}
            side={side}
            variant={variant}
            collapseMode={collapseMode}
            themeClasses={themeClasses}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            sidebarClassNames={sidebarClassNames}
            railClassNames={railClassNames}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render using Portal for floating variant, or directly for other variants
  if (variant === "floating") {
    return (
      <PortalComponent
        x={side === "left" ? 0 : "100vw"}
        y={0}
        width={width}
        height="100%"
        anchorX={side === "left" ? "left" : "right"}
      >
        {sidebarContent}
      </PortalComponent>
    );
  }

  return sidebarContent;
}
