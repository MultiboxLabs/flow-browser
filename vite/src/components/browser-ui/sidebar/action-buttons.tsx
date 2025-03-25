import { GoBackButton, GoForwardButton } from "@/components/browser-ui/sidebar/navigation-buttons";
import { useBrowser } from "@/components/main/browser-context";
import { Button } from "@/components/ui/button";
import { SidebarGroup, useSidebar } from "@/components/ui/resizable-sidebar";
import { getTabNavigationStatus, NavigationEntry, stopLoadingTab } from "@/lib/flow";
import { RefreshCwIcon, SidebarCloseIcon, XIcon } from "lucide-react";
import { ComponentProps, useEffect, useState } from "react";

export type NavigationEntryWithIndex = NavigationEntry & { index: number };

export function SidebarActionButton({
  icon,
  disabled = false,
  ...props
}: {
  icon: React.ReactNode;
  disabled?: boolean;
} & ComponentProps<typeof Button>) {
  return (
    <Button size="icon" variant="ghost" className="size-8" disabled={disabled} {...props}>
      {icon}
    </Button>
  );
}

export function NavigationControls() {
  const { handleReload, activeTab } = useBrowser();
  const { open, setOpen } = useSidebar();

  const [entries, setEntries] = useState<NavigationEntryWithIndex[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const isLoading = activeTab?.status === "loading";

  useEffect(() => {
    const tabId = activeTab?.id;
    if (!tabId) return;

    getTabNavigationStatus(tabId).then((status) => {
      if (!status) return;
      setCanGoBack(status.canGoBack);
      setCanGoForward(status.canGoForward);
      setEntries(status.navigationHistory.map((entry, index) => ({ ...entry, index })));
      setActiveIndex(status.activeIndex);
    });
  }, [activeTab]);

  if (!open) return null;

  const closeSidebar = () => {
    setOpen(false);
  };

  const handleStopLoading = () => {
    if (!activeTab?.id) return;
    stopLoadingTab(activeTab.id);
  };

  return (
    <SidebarGroup className="flex flex-row justify-between">
      <div className="flex flex-row gap-1">
        <SidebarActionButton icon={<SidebarCloseIcon className="w-4 h-4" />} onClick={closeSidebar} />

        {/* Browser Actions */}
        {/* @ts-expect-error - Custom injected element */}
        <browser-action-list id="actions" alignment="bottom right" />
      </div>
      <div className="flex flex-row gap-1">
        <GoBackButton canGoBack={canGoBack} backwardTabs={entries.slice(0, activeIndex).reverse()} />
        <GoForwardButton canGoForward={canGoForward} forwardTabs={entries.slice(activeIndex + 1)} />
        {!isLoading && <SidebarActionButton icon={<RefreshCwIcon className="w-4 h-4" />} onClick={handleReload} />}
        {isLoading && <SidebarActionButton icon={<XIcon className="w-4 h-4" />} onClick={handleStopLoading} />}
      </div>
    </SidebarGroup>
  );
}
