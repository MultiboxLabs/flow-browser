import { type ActivateEventType, useBrowserAction } from "@/components/providers/browser-action-provider";
import { useExtensions } from "@/components/providers/extensions-provider";
import { cn } from "@/lib/utils";
import { PuzzleIcon } from "lucide-react";
import { MouseEvent, useCallback, useState } from "react";

interface PinnedActionProps {
  action: {
    id: string;
    title: string;
    popup: string;
    tabs: Record<
      string,
      {
        color?: string;
        text?: string;
        icon?: chrome.browserAction.TabIconDetails;
        iconModified?: number;
      }
    >;
  };
  activeTabId: number | undefined;
  partition: string;
  activate: (
    extensionId: string,
    tabId: number,
    anchorEl: HTMLElement,
    alignment: string,
    eventType: ActivateEventType
  ) => void;
}

function PinnedAction({ action, activeTabId, partition, activate }: PinnedActionProps) {
  const [isError, setIsError] = useState(false);
  const tabId = typeof activeTabId === "number" && activeTabId > -1 ? activeTabId : -1;
  const tabInfo = tabId > -1 ? action.tabs[tabId] : null;

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>, eventType: ActivateEventType) => {
      event.stopPropagation();
      activate(action.id, tabId, event.currentTarget, "bottom right", eventType);
    },
    [action.id, tabId, activate]
  );

  const iconSize = 32;
  const resizeType = 2;
  const { iconModified } = { ...action, ...tabInfo };
  const timeParam = iconModified ? `&t=${iconModified}` : "";
  const iconUrl = `crx://extension-icon/${action.id}/${iconSize}/${resizeType}?tabId=${tabId}${timeParam}&partition=${encodeURIComponent(partition)}`;

  return (
    <button
      className={cn(
        "size-6 flex items-center justify-center rounded-md",
        "hover:bg-black/15 dark:hover:bg-white/20",
        "transition-colors duration-150",
        "relative shrink-0"
      )}
      onClick={(event) => handleClick(event, "click")}
      onContextMenu={(event) => handleClick(event, "contextmenu")}
      title={action.title}
    >
      {isError ? (
        <PuzzleIcon className="size-4" />
      ) : (
        <svg className="size-4">
          {/* eslint-disable-next-line react/no-unknown-property */}
          <image href={iconUrl} className="size-4 object-contain shrink-0" onError={() => setIsError(true)} />
        </svg>
      )}
      {tabInfo?.text && (
        <div
          className="absolute bottom-0 right-0 min-w-3 h-3 px-1 rounded text-[9px] leading-3 flex items-center justify-center font-medium"
          style={{
            backgroundColor: tabInfo.color || "#666",
            color: "#fff",
            transform: "translate(25%, 25%)"
          }}
        >
          {tabInfo.text}
        </div>
      )}
    </button>
  );
}

export function PinnedBrowserActions() {
  const { actions, activeTabId, partition, activate } = useBrowserAction();
  const { extensions } = useExtensions();

  const pinnedExtensionIds = extensions.filter((e) => e.pinned).map((e) => e.id);
  const pinnedActions = actions.filter((action) => pinnedExtensionIds.includes(action.id));

  if (pinnedActions.length === 0) {
    return null;
  }

  return (
    <>
      {pinnedActions.map((action) => (
        <PinnedAction
          key={action.id}
          action={action}
          activeTabId={activeTabId}
          partition={partition}
          activate={activate}
        />
      ))}
    </>
  );
}
