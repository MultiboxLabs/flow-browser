import { SIDEBAR_HOVER_COLOR } from "@/components/browser-ui/browser-sidebar";
import { useBrowserAction } from "@/components/providers/browser-action-provider";
import { useExtensions } from "@/components/providers/extensions-provider";
import { useSpaces } from "@/components/providers/spaces-provider";
import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenu, SidebarMenuButton } from "@/components/ui/resizable-sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CogIcon, LayersIcon, PackageXIcon, PinIcon, PinOffIcon, PuzzleIcon } from "lucide-react";
import { MouseEvent, useCallback, useMemo, useRef, useState } from "react";
import { PortalPopover } from "@/components/portal/popover";
import { useBrowserUITranslations } from "@/lib/i18n";

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
      {/* eslint-disable-next-line react/no-unknown-property */}
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
  // Action //
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

  // Extension //
  const extensionId = action.id;
  const { extensions } = useExtensions();
  const extension = extensions.find((e) => e.id === extensionId);
  const isPinned = extension?.pinned;

  const togglePin = useCallback(() => {
    if (!extensionId) return;
    flow.extensions.setExtensionPinned(extensionId, !isPinned);
  }, [extensionId, isPinned]);

  // UI //
  return (
    <div className="flex flex-row justify-between gap-0.5">
      <SidebarMenuButton id={action.id} ref={buttonRef} onClick={onClick} onContextMenu={onContextMenu}>
        <BrowserActionIcon action={action} activeTabId={activeTabId} tabInfo={tabInfo} partitionId={partition} />
        <Badge color={tabInfo?.color} text={tabInfo?.text} />
        <span className="font-semibold truncate">{action.title}</span>
      </SidebarMenuButton>
      <Button variant="ghost" size="icon" onClick={togglePin}>
        {isPinned ? <PinOffIcon className="size-4" /> : <PinIcon className="size-4" />}
      </Button>
    </div>
  );
}

export function BrowserActionList({ alignmentX = "left", alignmentY = "bottom" }: BrowserActionListProps) {
  const { t } = useBrowserUITranslations();
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

  const noActions = actions.length === 0;
  const noActiveTab = typeof activeTabId !== "number";
  const disabled = noActiveTab || noActions;

  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");
  return (
    <PortalPopover.Root open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton className={cn(SIDEBAR_HOVER_COLOR, "text-black dark:text-white")}>
          <PuzzleIcon />
        </SidebarMenuButton>
      </PopoverTrigger>
      <PortalPopover.Content className={cn("w-56 p-2 select-none", spaceInjectedClasses)}>
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
          {noActiveTab && (
            <SidebarMenuButton disabled>
              <LayersIcon />
              {t("No Active Tab")}
            </SidebarMenuButton>
          )}
          {!noActiveTab && noActions && (
            <SidebarMenuButton disabled>
              <PackageXIcon />
              {t("No Extensions Available")}
            </SidebarMenuButton>
          )}
          <Separator />
          <SidebarMenuButton onClick={openExtensionsPage}>
            <CogIcon />
            <span className="font-semibold truncate">{t("Manage Extensions")}</span>
          </SidebarMenuButton>
        </SidebarMenu>
      </PortalPopover.Content>
    </PortalPopover.Root>
  );
}
