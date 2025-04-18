import { NavigationEntryWithIndex, SidebarActionButton } from "@/components/browser-ui/sidebar/header/action-buttons";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useTabs } from "@/components/providers/tabs-provider";
import { SIDEBAR_HOVER_COLOR } from "@/components/browser-ui/browser-sidebar";

interface NavigationButtonProps {
  canNavigate: boolean;
  navigationEntries: NavigationEntryWithIndex[];
  icon: React.ReactNode;
  onNavigate: () => void;
}

function NavigationButton({ canNavigate, navigationEntries, icon, onNavigate }: NavigationButtonProps) {
  const { focusedTab } = useTabs();
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
          className={SIDEBAR_HOVER_COLOR}
        />
      </DropdownMenuTrigger>
      {navigationEntries.length > 0 && (
        <DropdownMenuContent align="end">
          {navigationEntries.map((entry, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => {
                if (!focusedTab?.id) return;
                flow.navigation.goToNavigationEntry(focusedTab.id, entry.index);
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
  const { focusedTab } = useTabs();

  const goBack = () => {
    if (!focusedTab?.id) return;
    if (backwardTabs.length === 0) return;
    flow.navigation.goToNavigationEntry(focusedTab.id, backwardTabs[0].index);
  };

  return (
    <NavigationButton
      canNavigate={canGoBack}
      navigationEntries={backwardTabs}
      icon={<ArrowLeftIcon className="w-4 h-4" />}
      onNavigate={goBack}
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
  const { focusedTab } = useTabs();

  const goForward = () => {
    if (!focusedTab?.id) return;
    if (forwardTabs.length === 0) return;
    flow.navigation.goToNavigationEntry(focusedTab.id, forwardTabs[0].index);
  };

  return (
    <NavigationButton
      canNavigate={canGoForward}
      navigationEntries={forwardTabs}
      icon={<ArrowRightIcon className="w-4 h-4" />}
      onNavigate={goForward}
    />
  );
}
