import { SIDEBAR_HOVER_COLOR } from "@/components/browser-ui/browser-sidebar";
import { useBrowserAction } from "@/components/providers/browser-action-provider";
import { useSpaces } from "@/components/providers/spaces-provider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenu, SidebarMenuButton } from "@/components/ui/resizable-sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CogIcon, LayersIcon, PackageXIcon, PinIcon, PuzzleIcon } from "lucide-react";
import { MouseEvent, useCallback, useMemo, useRef, useState } from "react";

interface BrowserActionListProps {
  partition?: string;
  alignmentX?: "left" | "right";
  alignmentY?: "top" | "bottom";
}

interface ExtensionAction {
  color?: string;
  text?: string;
  title?: string;
  icon?: chrome.browserAction.TabIconDetails;
  popup?: string;
  /** Last modified date for icon. */
  iconModified?: number;
}

interface Action {
  id: string;
  title: string;
  popup: string;
  tabs: Record<string, ExtensionAction>;
}

type BrowserActionIconProps = {
  action: Action;
  activeTabId: number;
  tabInfo: ExtensionAction | null;
  partitionId: string;
};

function BrowserActionIcon({ action, activeTabId, tabInfo, partitionId }: BrowserActionIconProps) {
  const { iconModified } = { ...action, ...tabInfo };

  const [isError, setIsError] = useState(false);
  const iconSize = 32;
  const resizeType = 2;
  const timeParam = iconModified ? `&t=${iconModified}` : "";
  const iconUrl = `crx://extension-icon/${action.id}/${iconSize}/${resizeType}?tabId=${activeTabId}${timeParam}&partition=${encodeURIComponent(partitionId)}`;

  if (isError) {
    return <PuzzleIcon />;
  }

  return (
    <svg>
      <image href={iconUrl} className="size-4 object-contain shrink-0" onError={() => setIsError(true)} />
    </svg>
  );
}

type BadgeProps = {
  color?: string;
  text?: string;
};

function Badge({ color, text }: BadgeProps) {
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

type BrowserActionProps = {
  action: Action;
  alignment: string;
  partition: string;
  activeTabId: number;
};
function BrowserAction({ action, alignment, partition, activeTabId }: BrowserActionProps) {
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

  return (
    <div className="flex flex-row justify-between gap-0.5">
      <SidebarMenuButton id={action.id} ref={buttonRef} onClick={onClick} onContextMenu={onContextMenu}>
        <BrowserActionIcon action={action} activeTabId={activeTabId} tabInfo={tabInfo} partitionId={partition} />
        <Badge color={tabInfo?.color} text={tabInfo?.text} />
        <span className="font-semibold truncate">{action.title}</span>
      </SidebarMenuButton>
      {/* TODO: Add pin functionality */}
      <Button variant="ghost" size="icon" disabled>
        <PinIcon className="size-4" />
      </Button>
    </div>
  );
}

export function BrowserActionList({ alignmentX = "left", alignmentY = "bottom" }: BrowserActionListProps) {
  const { isCurrentSpaceLight } = useSpaces();
  const { actions, activeTabId, partition } = useBrowserAction();
  const [open, setOpen] = useState(false);

  const alignment = useMemo(() => {
    return `${alignmentX} ${alignmentY}`;
  }, [alignmentX, alignmentY]);

  const openExtensionsPage = useCallback(() => {
    flow.tabs.newTab("flow://extensions", true);
    setOpen(false);
  }, []);

  const disabled = !activeTabId || actions.length === 0;

  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton className={cn(SIDEBAR_HOVER_COLOR, "text-black dark:text-white")}>
          <PuzzleIcon />
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent className={cn("w-56 p-2 select-none", spaceInjectedClasses)}>
        <SidebarMenu>
          {!disabled &&
            actions.map((action) => (
              <BrowserAction
                key={action.id}
                action={action}
                alignment={alignment}
                partition={partition}
                activeTabId={activeTabId}
              />
            ))}
          {!activeTabId && (
            <SidebarMenuButton disabled>
              <LayersIcon />
              No Active Tab
            </SidebarMenuButton>
          )}
          {activeTabId && !actions.length && (
            <SidebarMenuButton disabled>
              <PackageXIcon />
              No Extensions Available
            </SidebarMenuButton>
          )}
          <Separator />
          <SidebarMenuButton onClick={openExtensionsPage}>
            <CogIcon />
            <span className="font-semibold truncate">Manage Extensions</span>
          </SidebarMenuButton>
        </SidebarMenu>
      </PopoverContent>
    </Popover>
  );
}
