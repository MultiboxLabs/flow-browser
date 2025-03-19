import { useBrowser } from "@/components/main/browser-context";
import { Button } from "@/components/ui/button";
import { SidebarGroup, useSidebar } from "@/components/ui/resizable-sidebar";
import { getTabNavigationStatus, stopLoadingTab } from "@/lib/flow";
import { ArrowLeftIcon, RefreshCwIcon, SidebarCloseIcon, XIcon } from "lucide-react";
import { ArrowRightIcon } from "lucide-react";
import { useEffect, useState } from "react";

function SidebarActionButton({
  icon,
  onClick,
  disabled = false
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button onClick={onClick} size="icon" variant="ghost" className="size-8" disabled={disabled}>
      {icon}
    </Button>
  );
}

export function NavigationControls() {
  const { handleGoBack, handleGoForward, handleReload, activeTab } = useBrowser();
  const { open, setOpen } = useSidebar();

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
      </div>
      <div className="flex flex-row gap-1">
        <SidebarActionButton
          icon={<ArrowLeftIcon className="w-4 h-4" />}
          onClick={handleGoBack}
          disabled={!canGoBack}
        />
        <SidebarActionButton
          icon={<ArrowRightIcon className="w-4 h-4" />}
          onClick={handleGoForward}
          disabled={!canGoForward}
        />
        {!isLoading && <SidebarActionButton icon={<RefreshCwIcon className="w-4 h-4" />} onClick={handleReload} />}
        {isLoading && <SidebarActionButton icon={<XIcon className="w-4 h-4" />} onClick={handleStopLoading} />}
      </div>
    </SidebarGroup>
  );
}
