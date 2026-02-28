import { useBrowserAction } from "@/components/providers/browser-action-provider";
import { useExtensions } from "@/components/providers/extensions-provider";
import { useSpaces } from "@/components/providers/spaces-provider";
import { PortalPopover } from "@/components/portal/popover";
import { PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CogIcon, LayersIcon, PackageXIcon, PinIcon, PinOffIcon, PuzzleIcon } from "lucide-react";
import { MouseEvent, useCallback, useMemo, useRef, useState } from "react";

interface ExtensionAction {
  color?: string;
  text?: string;
  title?: string;
  icon?: chrome.browserAction.TabIconDetails;
  popup?: string;
  iconModified?: number;
}

interface Action {
  id: string;
  title: string;
  popup: string;
  tabs: Record<string, ExtensionAction>;
}

// Extension icon via crx:// protocol
function BrowserActionIcon({
  action,
  activeTabId,
  tabInfo,
  partitionId
}: {
  action: Action;
  activeTabId: number;
  tabInfo: ExtensionAction | null;
  partitionId: string;
}) {
  const { iconModified } = { ...action, ...tabInfo };
  const [isError, setIsError] = useState(false);
  const iconSize = 32;
  const resizeType = 2;
  const timeParam = iconModified ? `&t=${iconModified}` : "";
  const iconUrl = `crx://extension-icon/${action.id}/${iconSize}/${resizeType}?tabId=${activeTabId}${timeParam}&partition=${encodeURIComponent(partitionId)}`;

  if (isError) {
    return <PuzzleIcon className="size-4 shrink-0" />;
  }

  return (
    <svg className="size-4 shrink-0">
      {/* eslint-disable-next-line react/no-unknown-property */}
      <image href={iconUrl} className="size-4 object-contain" onError={() => setIsError(true)} />
    </svg>
  );
}

// Badge overlay on extension icon
function Badge({ color, text }: { color?: string; text?: string }) {
  if (!text) return null;

  return (
    <div
      className="absolute bottom-0 right-0 min-w-3 h-3 px-1 rounded text-[9px] leading-3 flex items-center justify-center font-medium"
      style={{
        backgroundColor: color || "#666",
        color: "#fff",
        transform: "translate(25%, 25%)"
      }}
    >
      {text}
    </div>
  );
}

// Individual extension action row
function BrowserAction({
  action,
  alignment,
  partition,
  activeTabId
}: {
  action: Action;
  alignment: string;
  partition: string;
  activeTabId: number;
}) {
  const { activate } = useBrowserAction();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const tabInfo = activeTabId > -1 ? action.tabs[activeTabId] : null;

  const onActivated = useCallback(() => {
    if (!buttonRef.current) return;
    activate(action.id, activeTabId, buttonRef.current, alignment);
  }, [action.id, activeTabId, alignment, activate]);

  const onClick = useCallback(() => {
    return onActivated();
  }, [onActivated]);

  const onContextMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
      return onActivated();
    },
    [onActivated]
  );

  // Pin/unpin state
  const extensionId = action.id;
  const { extensions } = useExtensions();
  const extension = extensions.find((e) => e.id === extensionId);
  const isPinned = extension?.pinned;

  const togglePin = useCallback(() => {
    if (!extensionId) return;
    flow.extensions.setExtensionPinned(extensionId, !isPinned);
  }, [extensionId, isPinned]);

  return (
    <div className="flex flex-row items-center justify-between gap-0.5">
      <button
        ref={buttonRef}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors"
      >
        <div className="relative shrink-0">
          <BrowserActionIcon action={action} activeTabId={activeTabId} tabInfo={tabInfo} partitionId={partition} />
          <Badge color={tabInfo?.color} text={tabInfo?.text} />
        </div>
        <span className="font-medium truncate">{action.title}</span>
      </button>
      <button
        onClick={togglePin}
        className="size-7 flex items-center justify-center rounded-sm hover:bg-accent transition-colors shrink-0"
      >
        {isPinned ? <PinOffIcon className="size-3.5" /> : <PinIcon className="size-3.5" />}
      </button>
    </div>
  );
}

// Main extensions popover for the new browser UI sidebar
export function BrowserActionList() {
  const { isCurrentSpaceLight } = useSpaces();
  const { actions, activeTabId, partition } = useBrowserAction();
  const [open, setOpen] = useState(false);

  const alignment = useMemo(() => "right bottom", []);

  const openExtensionsPage = useCallback(() => {
    flow.tabs.newTab("flow://extensions", true);
    setOpen(false);
  }, []);

  const noActions = actions.length === 0;
  const noActiveTab = typeof activeTabId !== "number";

  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");

  return (
    <PortalPopover.Root open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "size-8 flex items-center justify-center rounded-md",
            "bg-transparent hover:bg-black/10 dark:hover:bg-white/10",
            "transition-colors duration-100"
          )}
        >
          <PuzzleIcon strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
        </button>
      </PopoverTrigger>
      <PortalPopover.Content className={cn("w-56 p-2 select-none", spaceInjectedClasses)}>
        {!noActiveTab &&
          !noActions &&
          actions.map((action) => (
            <BrowserAction
              key={action.id}
              action={action}
              alignment={alignment}
              partition={partition}
              activeTabId={activeTabId}
            />
          ))}
        {noActiveTab && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
            <LayersIcon className="size-4 shrink-0" />
            No Active Tab
          </div>
        )}
        {!noActiveTab && noActions && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
            <PackageXIcon className="size-4 shrink-0" />
            No Extensions Available
          </div>
        )}
        <Separator className="my-1" />
        <button
          onClick={openExtensionsPage}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors"
        >
          <CogIcon className="size-4 shrink-0" />
          <span className="font-medium truncate">Manage Extensions</span>
        </button>
      </PortalPopover.Content>
    </PortalPopover.Root>
  );
}
