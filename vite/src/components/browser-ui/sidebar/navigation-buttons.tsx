import { NavigationEntryWithIndex, SidebarActionButton } from "@/components/browser-ui/sidebar/action-buttons";
import { useBrowser } from "@/components/main/browser-context";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { goToNavigationEntry } from "@/lib/flow";
import { useState } from "react";

interface NavigationButtonProps {
  canNavigate: boolean;
  navigationEntries: NavigationEntryWithIndex[];
  icon: React.ReactNode;
  onNavigate: () => void;
}

function NavigationButton({ canNavigate, navigationEntries, icon, onNavigate }: NavigationButtonProps) {
  const { activeTab } = useBrowser();
  const [open, setOpen] = useState<boolean>(false);

  const handleButtonClick = () => {
    if (canNavigate) {
      onNavigate();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigationEntries.length > 0) {
      setOpen(true);
    }
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(open) => {
        // Keep auto-deselect, but disable the dropdown menu from being open as we have our own custom logic for opening it
        if (open === true) return;
        setOpen(open);
      }}
    >
      <DropdownMenuTrigger asChild>
        <SidebarActionButton
          icon={icon}
          onClick={handleButtonClick}
          onContextMenu={handleContextMenu}
          disabled={!canNavigate}
        />
      </DropdownMenuTrigger>
      {navigationEntries.length > 0 && (
        <DropdownMenuContent align="end">
          {navigationEntries.map((entry, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => {
                if (!activeTab?.id) return;
                goToNavigationEntry(activeTab.id, entry.index);
              }}
              className="max-w-[10rem] text-ellipsis truncate"
            >
              {entry.title || entry.url}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}

export function GoBackButton({
  canGoBack,
  backwardTabs
}: {
  canGoBack: boolean;
  backwardTabs: NavigationEntryWithIndex[];
}) {
  const { handleGoBack } = useBrowser();

  return (
    <NavigationButton
      canNavigate={canGoBack}
      navigationEntries={backwardTabs}
      icon={<ArrowLeftIcon className="w-4 h-4" />}
      onNavigate={handleGoBack}
    />
  );
}

export function GoForwardButton({
  canGoForward,
  forwardTabs
}: {
  canGoForward: boolean;
  forwardTabs: NavigationEntryWithIndex[];
}) {
  const { handleGoForward } = useBrowser();

  return (
    <NavigationButton
      canNavigate={canGoForward}
      navigationEntries={forwardTabs}
      icon={<ArrowRightIcon className="w-4 h-4" />}
      onNavigate={handleGoForward}
    />
  );
}
