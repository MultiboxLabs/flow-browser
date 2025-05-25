import { BrowserActionList } from "@/components/browser-ui/browser-action";
import { SIDEBAR_HOVER_COLOR } from "@/components/browser-ui/browser-sidebar";
import { GoBackButton, GoForwardButton } from "@/components/browser-ui/sidebar/header/navigation-buttons";
import { RefreshCWIcon, RefreshCWIconHandle } from "@/components/icons/refresh-cw";
import { useTabs } from "@/components/providers/tabs-provider";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/resizable-sidebar";
import { NavigationEntry } from "~/flow/interfaces/browser/navigation";
import { cn } from "@/lib/utils";
import { SidebarCloseIcon, SidebarOpenIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ComponentProps, useCallback, useEffect, useRef, useState } from "react";
import { TabData } from "~/types/tabs";

export type NavigationEntryWithIndex = NavigationEntry & { index: number };

export function SidebarActionButton({
  icon,
  className,
  disabled = false,
  ...props
}: {
  icon: React.ReactNode;
  disabled?: boolean;
} & ComponentProps<typeof SidebarMenuButton>) {
  return (
    <SidebarMenuButton
      disabled={disabled}
      className={cn(SIDEBAR_HOVER_COLOR, "text-black dark:text-white", className)}
      {...props}
    >
      {icon}
    </SidebarMenuButton>
  );
}

function ReloadButton({ focusedTab, handleReload }: { focusedTab: TabData | null; handleReload: () => void }) {
  const iconRef = useRef<RefreshCWIconHandle>(null);
  const isPressed = useRef(false);

  const handleMouseDown = useCallback(() => {
    if (!iconRef.current) return;
    iconRef.current.startAnimation();
    isPressed.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!iconRef.current) return;
    iconRef.current.stopAnimation();
    isPressed.current = false;
  }, []);

  // Add global mouseup listener to handle mouse release outside the button
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPressed.current) {
        handleMouseUp();
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleMouseUp]);

  return (
    <SidebarActionButton
      icon={<RefreshCWIcon ref={iconRef} className="size-4 !bg-transparent !cursor-default" asChild />}
      onClick={handleReload}
      className={SIDEBAR_HOVER_COLOR}
      disabled={!focusedTab}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  );
}

function StopLoadingIcon() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      <XIcon className="w-4 h-4" />
    </motion.div>
  );
}

export function NavigationControls() {
  const { focusedTab } = useTabs();
  const { open, setOpen } = useSidebar();

  const [entries, setEntries] = useState<NavigationEntryWithIndex[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const isLoading = focusedTab?.isLoading || false;

  useEffect(() => {
    const tabId = focusedTab?.id;
    if (!tabId) {
      setCanGoBack(false);
      setCanGoForward(false);
      setEntries([]);
      setActiveIndex(0);
      return;
    }

    flow.navigation.getTabNavigationStatus(tabId).then((status) => {
      if (!status) return;
      setCanGoBack(status.canGoBack);
      setCanGoForward(status.canGoForward);
      setEntries(status.navigationHistory.map((entry, index) => ({ ...entry, index })));
      setActiveIndex(status.activeIndex);
    });
  }, [focusedTab]);

  if (!open) {
    return (
      <SidebarMenu>
        <div className="mt-3" />
        <SidebarMenuItem>
          <SidebarMenuButton
            className={cn(SIDEBAR_HOVER_COLOR, "text-black dark:text-white")}
            onClick={() => setOpen(true)}
          >
            <SidebarOpenIcon />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const closeSidebar = () => {
    setOpen(false);
  };

  const handleStopLoading = () => {
    if (!focusedTab?.id) return;
    flow.navigation.stopLoadingTab(focusedTab.id);
  };

  const handleReload = () => {
    if (!focusedTab?.id) return;
    flow.navigation.reloadTab(focusedTab.id);
  };

  return (
    <SidebarGroup className="px-1">
      <SidebarMenu className="flex flex-row justify-between">
        {/* Left Side Buttons */}
        <SidebarMenuItem className="flex flex-row gap-0.5">
          <SidebarActionButton
            icon={<SidebarCloseIcon className="w-4 h-4" />}
            onClick={closeSidebar}
            className={SIDEBAR_HOVER_COLOR}
          />

          {/* Browser Actions */}
          <BrowserActionList alignmentY="bottom" alignmentX="right" />
        </SidebarMenuItem>
        {/* Right Side Buttons */}
        <SidebarMenuItem className="flex flex-row gap-0.5">
          <GoBackButton canGoBack={canGoBack} backwardTabs={entries.slice(0, activeIndex).reverse()} />
          <GoForwardButton canGoForward={canGoForward} forwardTabs={entries.slice(activeIndex + 1)} />
          <AnimatePresence mode="wait" initial={true}>
            {!isLoading && <ReloadButton key="reload-button" focusedTab={focusedTab} handleReload={handleReload} />}
            {isLoading && (
              <SidebarActionButton
                key="stop-loading-button"
                icon={<StopLoadingIcon />}
                onClick={handleStopLoading}
                className={SIDEBAR_HOVER_COLOR}
              />
            )}
          </AnimatePresence>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
