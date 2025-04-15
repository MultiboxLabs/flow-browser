import { SIDEBAR_HOVER_COLOR } from "@/components/browser-ui/browser-sidebar";
import { GoBackButton, GoForwardButton } from "@/components/browser-ui/sidebar/header/navigation-buttons";
import { useTabs } from "@/components/providers/tabs-provider";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/resizable-sidebar";
import { NavigationEntry } from "@/lib/flow/interfaces/browser/navigation";
import { cn } from "@/lib/utils";
import { RefreshCwIcon, SidebarCloseIcon, SidebarOpenIcon, XIcon } from "lucide-react";
import { ComponentProps, useEffect, useState } from "react";

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
    if (!tabId) return;

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
    <SidebarGroup>
      <SidebarMenu className="flex flex-row justify-between">
        {/* Left Side Buttons */}
        <SidebarMenuItem className="flex flex-row gap-0.5">
          <SidebarActionButton
            icon={<SidebarCloseIcon className="w-4 h-4" />}
            onClick={closeSidebar}
            className={SIDEBAR_HOVER_COLOR}
          />
        </SidebarMenuItem>
        {/* Right Side Buttons */}
        <SidebarMenuItem className="flex flex-row gap-0.5">
          <GoBackButton canGoBack={canGoBack} backwardTabs={entries.slice(0, activeIndex).reverse()} />
          <GoForwardButton canGoForward={canGoForward} forwardTabs={entries.slice(activeIndex + 1)} />
          {!isLoading && (
            <SidebarActionButton
              icon={<RefreshCwIcon className="w-4 h-4" />}
              onClick={handleReload}
              className={SIDEBAR_HOVER_COLOR}
              disabled={!focusedTab}
            />
          )}
          {isLoading && (
            <SidebarActionButton
              icon={<XIcon className="w-4 h-4" />}
              onClick={handleStopLoading}
              className={SIDEBAR_HOVER_COLOR}
            />
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
