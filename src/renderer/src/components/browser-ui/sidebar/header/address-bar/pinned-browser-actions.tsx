import { useBrowserAction } from "@/components/providers/browser-action-provider";
import { useExtensions } from "@/components/providers/extensions-provider";
import { cn } from "@/lib/utils";
import { PuzzleIcon } from "lucide-react";
import { MouseEvent, useCallback, useState } from "react";

// Maximum number of pinned actions to show in the address bar
const MAX_PINNED_ACTIONS = 3;

export function PinnedBrowserActions() {
  const { actions, activeTabId, partition, activate } = useBrowserAction();
  const { extensions } = useExtensions();

  const pinnedExtensions = extensions.filter((e) => e.pinned).map((e) => e.id);
  const pinnedActions = actions.filter((action) => pinnedExtensions.includes(action.id)).slice(0, MAX_PINNED_ACTIONS);

  if (pinnedActions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {pinnedActions.map((action) => (
        <PinnedAction
          key={action.id}
          action={action}
          activeTabId={activeTabId}
          partition={partition}
          activate={activate}
        />
      ))}
    </div>
  );
}

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
  activate: (extensionId: string, tabId: number, anchorEl: HTMLElement, alignment: string) => void;
}

function PinnedAction({ action, activeTabId, partition, activate }: PinnedActionProps) {
  const [isError, setIsError] = useState(false);
  const tabId = typeof activeTabId === "number" && activeTabId > -1 ? activeTabId : -1;
  const tabInfo = tabId > -1 ? action.tabs[tabId] : null;

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      activate(action.id, tabId, event.currentTarget, "bottom right");
    },
    [action.id, tabId, activate]
  );

  // Get icon URL
  const iconSize = 32;
  const resizeType = 2;
  const { iconModified } = { ...action, ...tabInfo };
  const timeParam = iconModified ? `&t=${iconModified}` : "";
  const iconUrl = `crx://extension-icon/${action.id}/${iconSize}/${resizeType}?tabId=${tabId}${timeParam}&partition=${encodeURIComponent(partition)}`;

  return (
    <button
      className={cn(
        "size-6 flex items-center justify-center rounded-md",
        "hover:bg-white/25 dark:hover:bg-white/20",
        "transition-colors duration-150",
        "relative"
      )}
      onClick={handleClick}
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
