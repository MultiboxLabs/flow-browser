import { useBrowser } from "@/components/main/browser-context";
import { Button } from "@/components/ui/button";
import { SidebarGroup, useSidebar } from "@/components/ui/resizable-sidebar";
import { ArrowLeftIcon, RefreshCwIcon, SidebarCloseIcon } from "lucide-react";
import { ArrowRightIcon } from "lucide-react";

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
  const { handleGoBack, handleGoForward, handleReload } = useBrowser();
  const { open, setOpen } = useSidebar();

  if (!open) return null;

  const closeSidebar = () => {
    setOpen(false);
  };

  return (
    <SidebarGroup className="flex flex-row justify-between">
      <div className="flex flex-row gap-1">
        <SidebarActionButton icon={<SidebarCloseIcon className="w-4 h-4" />} onClick={closeSidebar} />
      </div>
      <div className="flex flex-row gap-1">
        <SidebarActionButton icon={<ArrowLeftIcon className="w-4 h-4" />} onClick={handleGoBack} />
        <SidebarActionButton icon={<ArrowRightIcon className="w-4 h-4" />} onClick={handleGoForward} />
        <SidebarActionButton icon={<RefreshCwIcon className="w-4 h-4" />} onClick={handleReload} />
      </div>
    </SidebarGroup>
  );
}
