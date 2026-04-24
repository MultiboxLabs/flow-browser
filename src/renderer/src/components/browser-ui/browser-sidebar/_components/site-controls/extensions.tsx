import { type ActivateEventType, useBrowserAction } from "@/components/providers/browser-action-provider";
import { useExtensions } from "@/components/providers/extensions-provider";
import { cn } from "@/lib/utils";
import { CHROME_WEB_STORE_URL } from "@/routes/extensions/page";
import { PlusIcon, PuzzleIcon } from "lucide-react";
import { MouseEvent, useCallback, useRef, useState } from "react";

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

function RotatedPinInCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" className={className}>
      <defs>
        <mask id="pin-mask-rotated">
          <rect width="34" height="34" fill="white" />

          {/* Pin cutout */}
          <g
            transform="translate(5 5) rotate(35 12 12)"
            fill="black"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="10.5" y="17" width="2" height="6" rx="1.5" />
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
          </g>
        </mask>
      </defs>

      <circle cx="17" cy="17" r="17" fill="white" mask="url(#pin-mask-rotated)" />
    </svg>
  );
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
      className="absolute bottom-2 right-3.5 min-w-3 h-3 px-1 rounded text-[9px] leading-3 flex items-center justify-center font-medium"
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

function ExtensionButtonContainer({
  children,
  className,
  ...props
}: { children: React.ReactNode } & React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "relative flex items-center justify-center rounded-md group/button",
        "w-11.5 h-8 shrink-0",
        "bg-black/10 dark:bg-white/10",
        "hover:bg-black/20 dark:hover:bg-white/20",
        "transition-colors duration-150",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Grid tile for a single extension
function ExtensionGridTile({
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

  const { extensions } = useExtensions();
  const extension = extensions.find((e) => e.id === action.id);
  const isPinned = extension?.pinned;

  const onActivated = useCallback(
    (eventType: ActivateEventType) => {
      if (!buttonRef.current) return;
      activate(action.id, activeTabId, buttonRef.current, alignment, eventType);
    },
    [action.id, activeTabId, alignment, activate]
  );

  const onClick = useCallback(() => onActivated("click"), [onActivated]);

  const onContextMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
      return onActivated("contextmenu");
    },
    [onActivated]
  );

  return (
    <ExtensionButtonContainer ref={buttonRef} title={action.title} onClick={onClick} onContextMenu={onContextMenu}>
      <BrowserActionIcon action={action} activeTabId={activeTabId} tabInfo={tabInfo} partitionId={partition} />
      <Badge color={tabInfo?.color} text={tabInfo?.text} />
      <button
        className={cn(
          "-bottom-0.5 -right-0.5",
          "absolute size-3.5",
          "flex items-center justify-center",
          !isPinned && "opacity-0 group-hover/button:opacity-100 transition-opacity duration-150"
        )}
        onClick={(event) => {
          event.stopPropagation();
          flow.extensions.setExtensionPinned(action.id, !isPinned);
        }}
        tabIndex={-1}
      >
        <RotatedPinInCircle className={cn("size-3.5", isPinned ? "opacity-100" : "opacity-50")} />
      </button>
    </ExtensionButtonContainer>
  );
}

export function ExtensionsList({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { actions, activeTabId, partition } = useBrowserAction();
  const alignment = "right bottom" as const;

  const noActions = actions.length === 0;
  const noActiveTab = typeof activeTabId !== "number";

  if (noActiveTab || noActions) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {actions.map((action) => (
        <ExtensionGridTile
          key={action.id}
          action={action}
          alignment={alignment}
          partition={partition}
          activeTabId={activeTabId}
        />
      ))}
      <ExtensionButtonContainer
        onClick={(event) => {
          event.stopPropagation();
          flow.tabs.newTab(CHROME_WEB_STORE_URL, true);
          setOpen(false);
        }}
      >
        <PlusIcon className="size-4 shrink-0" />
      </ExtensionButtonContainer>
    </div>
  );
}

export function SiteControlExtensions({ setOpen }: { setOpen: (open: boolean) => void }) {
  return (
    <div className="group">
      {/* Title and Manage button */}
      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm">Extensions</span>
        <button
          className={cn(
            "font-semibold text-xs text-gray-400",
            "group-hover:opacity-100 opacity-0",
            "transition-opacity duration-150",
            "hover:bg-white/5 px-1.5 py-0.5 rounded-sm"
          )}
          tabIndex={-1}
          onClick={(event) => {
            flow.tabs.newTab("flow://extensions", true);
            setOpen(false);
            event.stopPropagation();
          }}
        >
          Manage
        </button>
      </div>
      {/* Extensions list */}
      <div className="flex flex-col gap-2">
        <ExtensionsList setOpen={setOpen} />
      </div>
    </div>
  );
}
