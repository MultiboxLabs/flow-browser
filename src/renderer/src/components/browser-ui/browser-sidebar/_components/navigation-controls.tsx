import { RefreshCWIcon, RefreshCWIconHandle } from "@/components/icons/refresh-cw";
import { ArrowLeftIcon, ArrowLeftIconHandle } from "@/components/icons/arrow-left";
import { ArrowRightIcon, ArrowRightIconHandle } from "@/components/icons/arrow-right";
import { useTabs } from "@/components/providers/tabs-provider";
import { useSpaces } from "@/components/providers/spaces-provider";
import { PortalPopover } from "@/components/portal/popover";
import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavigationEntry } from "~/flow/interfaces/browser/navigation";

type NavigationEntryWithIndex = NavigationEntry & { index: number };

// Small icon-only button that matches the new sidebar styling
function NavButton({
  icon,
  disabled = false,
  onClick,
  onContextMenu,
  onMouseDown,
  onMouseUp
}: {
  icon: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      className={cn(
        "size-7 flex items-center justify-center rounded-md",
        "bg-transparent hover:bg-black/10 dark:hover:bg-white/10",
        "text-black/80 dark:text-white/80",
        "disabled:opacity-30 disabled:pointer-events-none",
        "transition-colors duration-100"
      )}
    >
      {icon}
    </button>
  );
}

// Back button with right-click history popover
function GoBackButton({
  canGoBack,
  backwardEntries
}: {
  canGoBack: boolean;
  backwardEntries: NavigationEntryWithIndex[];
}) {
  const { focusedTab } = useTabs();
  const { isCurrentSpaceLight } = useSpaces();
  const iconRef = useRef<ArrowLeftIconHandle>(null);
  const isPressed = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const goBack = useCallback(() => {
    if (!focusedTab?.id || backwardEntries.length === 0) return;
    flow.navigation.goToNavigationEntry(focusedTab.id, backwardEntries[0].index);
  }, [focusedTab, backwardEntries]);

  const handleMouseDown = useCallback(() => {
    iconRef.current?.startAnimation();
    isPressed.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    iconRef.current?.stopAnimation();
    isPressed.current = false;
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPressed.current) handleMouseUp();
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [handleMouseUp]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (backwardEntries.length > 0) setOpen(true);
    },
    [backwardEntries]
  );

  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");

  return (
    <div className="relative">
      <NavButton
        icon={<ArrowLeftIcon ref={iconRef} className="size-4 bg-transparent! cursor-default!" asChild />}
        disabled={!canGoBack}
        onClick={goBack}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />

      {backwardEntries.length > 0 && (
        <PortalPopover.Root open={open} onOpenChange={setOpen}>
          <PopoverTrigger ref={triggerRef} className="absolute opacity-0 pointer-events-none" />
          <PortalPopover.Content className={cn("w-56 p-2", spaceInjectedClasses)}>
            {backwardEntries.map((entry, index) => (
              <div
                key={index}
                onClick={() => {
                  if (!focusedTab?.id) return;
                  flow.navigation.goToNavigationEntry(focusedTab.id, entry.index);
                  setOpen(false);
                }}
                className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent max-w-full text-ellipsis truncate"
              >
                {entry.title || entry.url}
              </div>
            ))}
          </PortalPopover.Content>
        </PortalPopover.Root>
      )}
    </div>
  );
}

// Forward button with right-click history popover
function GoForwardButton({
  canGoForward,
  forwardEntries
}: {
  canGoForward: boolean;
  forwardEntries: NavigationEntryWithIndex[];
}) {
  const { focusedTab } = useTabs();
  const { isCurrentSpaceLight } = useSpaces();
  const iconRef = useRef<ArrowRightIconHandle>(null);
  const isPressed = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const goForward = useCallback(() => {
    if (!focusedTab?.id || forwardEntries.length === 0) return;
    flow.navigation.goToNavigationEntry(focusedTab.id, forwardEntries[0].index);
  }, [focusedTab, forwardEntries]);

  const handleMouseDown = useCallback(() => {
    iconRef.current?.startAnimation();
    isPressed.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    iconRef.current?.stopAnimation();
    isPressed.current = false;
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPressed.current) handleMouseUp();
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [handleMouseUp]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (forwardEntries.length > 0) setOpen(true);
    },
    [forwardEntries]
  );

  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");

  return (
    <div className="relative">
      <NavButton
        icon={<ArrowRightIcon ref={iconRef} className="size-4 bg-transparent! cursor-default!" asChild />}
        disabled={!canGoForward}
        onClick={goForward}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />

      {forwardEntries.length > 0 && (
        <PortalPopover.Root open={open} onOpenChange={setOpen}>
          <PopoverTrigger ref={triggerRef} className="absolute opacity-0 pointer-events-none" />
          <PortalPopover.Content className={cn("w-56 p-2", spaceInjectedClasses)}>
            {forwardEntries.map((entry, index) => (
              <div
                key={index}
                onClick={() => {
                  if (!focusedTab?.id) return;
                  flow.navigation.goToNavigationEntry(focusedTab.id, entry.index);
                  setOpen(false);
                }}
                className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent max-w-full text-ellipsis truncate"
              >
                {entry.title || entry.url}
              </div>
            ))}
          </PortalPopover.Content>
        </PortalPopover.Root>
      )}
    </div>
  );
}

// Reload button with animated icon
function ReloadButton({ disabled, onReload }: { disabled: boolean; onReload: () => void }) {
  const iconRef = useRef<RefreshCWIconHandle>(null);
  const isPressed = useRef(false);

  const handleMouseDown = useCallback(() => {
    iconRef.current?.startAnimation();
    isPressed.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    iconRef.current?.stopAnimation();
    isPressed.current = false;
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPressed.current) handleMouseUp();
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [handleMouseUp]);

  return (
    <NavButton
      icon={<RefreshCWIcon ref={iconRef} className="size-4 bg-transparent! cursor-default!" asChild />}
      disabled={disabled}
      onClick={onReload}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  );
}

// Stop loading button with animated X icon
function StopLoadingButton({ onStop }: { onStop: () => void }) {
  return (
    <NavButton
      icon={
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <XIcon className="w-4 h-4" />
        </motion.div>
      }
      onClick={onStop}
    />
  );
}

// Main navigation controls component
export function NavigationControls() {
  const { focusedTab } = useTabs();

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

  const backwardEntries = useMemo(() => entries.slice(0, activeIndex).reverse(), [entries, activeIndex]);
  const forwardEntries = useMemo(() => entries.slice(activeIndex + 1), [entries, activeIndex]);

  const handleStopLoading = useCallback(() => {
    if (!focusedTab?.id) return;
    flow.navigation.stopLoadingTab(focusedTab.id);
  }, [focusedTab]);

  const handleReload = useCallback(() => {
    if (!focusedTab?.id) return;
    flow.navigation.reloadTab(focusedTab.id);
  }, [focusedTab]);

  return (
    <div className="flex items-center gap-0.5 min-h-4">
      <GoBackButton canGoBack={canGoBack} backwardEntries={backwardEntries} />
      <GoForwardButton canGoForward={canGoForward} forwardEntries={forwardEntries} />
      <AnimatePresence mode="wait" initial={true}>
        {!isLoading && <ReloadButton key="reload-button" disabled={!focusedTab} onReload={handleReload} />}
        {isLoading && <StopLoadingButton key="stop-loading-button" onStop={handleStopLoading} />}
      </AnimatePresence>
    </div>
  );
}
