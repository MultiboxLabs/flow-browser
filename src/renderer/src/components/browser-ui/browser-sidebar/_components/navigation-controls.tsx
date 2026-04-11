import { RefreshCWIcon, RefreshCWIconHandle } from "@/components/icons/refresh-cw";
import { ArrowLeftIcon, ArrowLeftIconHandle } from "@/components/icons/arrow-left";
import { ArrowRightIcon, ArrowRightIconHandle } from "@/components/icons/arrow-right";
import { useAddressUrl, useFocusedTabId, useFocusedTabLoading } from "@/components/providers/tabs-provider";
import { useSpaces } from "@/components/providers/spaces-provider";
import { PortalPopover } from "@/components/portal/popover";
import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavigationEntry } from "~/flow/interfaces/browser/navigation";

type NavigationEntryWithIndex = NavigationEntry & { index: number };

/** Shared animation handle shape for icon refs (ArrowLeft, ArrowRight, RefreshCW). */
interface AnimatableIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

/**
 * Hook that manages mouse-press animation on an icon ref.
 * Starts animation on mouse down, stops on mouse up (including global mouseup
 * to handle the case where the user releases outside the button).
 */
function usePressAnimation(iconRef: React.RefObject<AnimatableIconHandle | null>) {
  const isPressed = useRef(false);

  const handleMouseDown = useCallback(() => {
    iconRef.current?.startAnimation();
    isPressed.current = true;
  }, [iconRef]);

  const handleMouseUp = useCallback(() => {
    iconRef.current?.stopAnimation();
    isPressed.current = false;
  }, [iconRef]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPressed.current) handleMouseUp();
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [handleMouseUp]);

  return { handleMouseDown, handleMouseUp };
}

// Small icon-only button that matches the new sidebar styling
export function NavButton({
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

// Unified back/forward button with right-click history popover
function NavigationButton({
  direction,
  focusedTabId,
  canNavigate,
  entries
}: {
  direction: "back" | "forward";
  focusedTabId: number | undefined;
  canNavigate: boolean;
  entries: NavigationEntryWithIndex[];
}) {
  const { isCurrentSpaceLight } = useSpaces();
  const iconRef = useRef<ArrowLeftIconHandle | ArrowRightIconHandle>(null);
  const [open, setOpen] = useState(false);
  const { handleMouseDown, handleMouseUp } = usePressAnimation(iconRef);

  const navigate = useCallback(() => {
    if (!focusedTabId || entries.length === 0) return;
    flow.navigation.goToNavigationEntry(focusedTabId, entries[0].index);
  }, [focusedTabId, entries]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (entries.length > 0) {
        handleMouseUp();
        setOpen(true);
      }
    },
    [entries, handleMouseUp]
  );

  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");

  const icon =
    direction === "back" ? (
      <ArrowLeftIcon ref={iconRef} className="size-4 bg-transparent! cursor-default!" asChild />
    ) : (
      <ArrowRightIcon ref={iconRef} className="size-4 bg-transparent! cursor-default!" asChild />
    );

  return (
    <div className="relative">
      <NavButton
        icon={icon}
        disabled={!canNavigate}
        onClick={navigate}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />

      {entries.length > 0 && (
        <PortalPopover.Root open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="absolute inset-0 opacity-0 pointer-events-none" />
          <PortalPopover.Content className={cn("w-56 p-2", "select-none", spaceInjectedClasses)}>
            {entries.map((entry, index) => (
              <div
                key={index}
                onClick={() => {
                  if (!focusedTabId) return;
                  flow.navigation.goToNavigationEntry(focusedTabId, entry.index);
                  setOpen(false);
                }}
                className="min-w-0 w-full truncate px-2 py-1.5 text-sm rounded-sm hover:bg-accent"
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
  const { handleMouseDown, handleMouseUp } = usePressAnimation(iconRef);

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
  const focusedTabId = useFocusedTabId() ?? undefined;
  const isLoading = useFocusedTabLoading();
  const addressUrl = useAddressUrl();

  const [entries, setEntries] = useState<NavigationEntryWithIndex[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const tabId = focusedTabId;
    if (!tabId) {
      setCanGoBack(false);
      setCanGoForward(false);
      setEntries([]);
      setActiveIndex(0);
      return;
    }

    let cancelled = false;
    flow.navigation.getTabNavigationStatus(tabId).then((status) => {
      if (cancelled || !status) return;
      setCanGoBack(status.canGoBack);
      setCanGoForward(status.canGoForward);
      setEntries(status.navigationHistory.map((entry, index) => ({ ...entry, index })));
      setActiveIndex(status.activeIndex);
    });

    return () => {
      cancelled = true;
    };
  }, [focusedTabId, isLoading, addressUrl]);

  const backwardEntries = useMemo(() => entries.slice(0, activeIndex).reverse(), [entries, activeIndex]);
  const forwardEntries = useMemo(() => entries.slice(activeIndex + 1), [entries, activeIndex]);

  const handleStopLoading = useCallback(() => {
    if (!focusedTabId) return;
    flow.navigation.stopLoadingTab(focusedTabId);
  }, [focusedTabId]);

  const handleReload = useCallback(() => {
    if (!focusedTabId) return;
    flow.navigation.reloadTab(focusedTabId);
  }, [focusedTabId]);

  return (
    <div className="flex items-center gap-0.5 min-h-4">
      <NavigationButton
        direction="back"
        focusedTabId={focusedTabId}
        canNavigate={canGoBack}
        entries={backwardEntries}
      />
      <NavigationButton
        direction="forward"
        focusedTabId={focusedTabId}
        canNavigate={canGoForward}
        entries={forwardEntries}
      />
      <AnimatePresence mode="wait" initial={true}>
        {!isLoading && <ReloadButton key="reload-button" disabled={!focusedTabId} onReload={handleReload} />}
        {isLoading && <StopLoadingButton key="stop-loading-button" onStop={handleStopLoading} />}
      </AnimatePresence>
    </div>
  );
}
