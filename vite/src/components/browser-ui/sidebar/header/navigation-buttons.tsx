import { NavigationEntryWithIndex, SidebarActionButton } from "@/components/browser-ui/sidebar/header/action-buttons";
import { useRef, useState, useEffect } from "react";
import { useTabs } from "@/components/providers/tabs-provider";
import { SIDEBAR_HOVER_COLOR } from "@/components/browser-ui/browser-sidebar";
import { ArrowLeftIcon, ArrowLeftIconHandle } from "@/components/icons/arrow-left";
import { ArrowRightIcon, ArrowRightIconHandle } from "@/components/icons/arrow-right";
import { PopoverTrigger } from "@/components/ui/popover";
import { PortalPopover } from "@/components/portal/popover";
import { cn } from "@/lib/utils";
import { useSpaces } from "@/components/providers/spaces-provider";

interface NavigationButtonProps {
  canNavigate: boolean;
  navigationEntries: NavigationEntryWithIndex[];
  icon: React.ReactNode;
  onNavigate: () => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
}

function AnimatedArrowLeftIcon({ ref }: { ref?: React.RefObject<ArrowLeftIconHandle | null> }) {
  return <ArrowLeftIcon ref={ref} className="size-4 !bg-transparent !cursor-default" asChild />;
}

function AnimatedArrowRightIcon({ ref }: { ref?: React.RefObject<ArrowRightIconHandle | null> }) {
  return <ArrowRightIcon ref={ref} className="size-4 !bg-transparent !cursor-default" asChild />;
}

function NavigationButton({
  canNavigate,
  navigationEntries,
  icon,
  onNavigate,
  onMouseDown,
  onMouseUp
}: NavigationButtonProps) {
  const { focusedTab } = useTabs();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState<boolean>(false);
  const { isCurrentSpaceLight } = useSpaces();

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

  if (navigationEntries.length === 0) {
    // If there are no navigation entries, just render the button directly without dropdown
    return (
      <SidebarActionButton
        icon={icon}
        onClick={handleButtonClick}
        disabled={!canNavigate}
        className={SIDEBAR_HOVER_COLOR}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      />
    );
  }

  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");
  return (
    <div className="relative">
      <SidebarActionButton
        icon={icon}
        onClick={handleButtonClick}
        onContextMenu={handleContextMenu}
        disabled={!canNavigate}
        className={SIDEBAR_HOVER_COLOR}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      />

      <PortalPopover.Root open={open} onOpenChange={setOpen}>
        <PopoverTrigger ref={triggerRef} className="absolute opacity-0 pointer-events-none" />
        <PortalPopover.Content className={cn("w-56 p-2", spaceInjectedClasses)}>
          {navigationEntries.map((entry, index) => (
            <div
              key={index}
              onClick={() => {
                if (!focusedTab?.id) return;
                flow.navigation.goToNavigationEntry(focusedTab.id, entry.index);
                setOpen(false);
              }}
              className="flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent max-w-full text-ellipsis truncate"
            >
              {entry.title || entry.url}
            </div>
          ))}
        </PortalPopover.Content>
      </PortalPopover.Root>
    </div>
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
  const iconRef = useRef<ArrowLeftIconHandle>(null);
  const isPressed = useRef<boolean>(false);

  const goBack = () => {
    if (!focusedTab?.id) return;
    if (backwardTabs.length === 0) return;
    flow.navigation.goToNavigationEntry(focusedTab.id, backwardTabs[0].index);
  };

  const handleMouseDown = () => {
    if (!iconRef.current) return;
    iconRef.current.startAnimation();
    isPressed.current = true;
  };

  const handleMouseUp = () => {
    if (!iconRef.current) return;
    iconRef.current.stopAnimation();
    isPressed.current = false;
  };

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
  }, []);

  return (
    <NavigationButton
      canNavigate={canGoBack}
      navigationEntries={backwardTabs}
      icon={<AnimatedArrowLeftIcon ref={iconRef} />}
      onNavigate={goBack}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
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
  const iconRef = useRef<ArrowRightIconHandle>(null);
  const isPressed = useRef<boolean>(false);

  const goForward = () => {
    if (!focusedTab?.id) return;
    if (forwardTabs.length === 0) return;
    flow.navigation.goToNavigationEntry(focusedTab.id, forwardTabs[0].index);
  };

  const handleMouseDown = () => {
    const icon = iconRef.current;
    if (!icon) return;

    icon.startAnimation();
    isPressed.current = true;
  };

  const handleMouseUp = () => {
    const icon = iconRef.current;
    if (!icon) return;

    icon.stopAnimation();
    isPressed.current = false;
  };

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
  }, []);

  return (
    <NavigationButton
      canNavigate={canGoForward}
      navigationEntries={forwardTabs}
      icon={<AnimatedArrowRightIcon ref={iconRef} />}
      onNavigate={goForward}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  );
}
