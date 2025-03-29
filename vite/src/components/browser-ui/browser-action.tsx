import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenu, SidebarMenuButton } from "@/components/ui/resizable-sidebar";
import { PinIcon, PuzzleIcon } from "lucide-react";
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface BrowserActionListProps {
  partition?: string;
  alignmentX?: "left" | "right";
  alignmentY?: "top" | "bottom";
}

interface ActivateDetails {
  eventType: string;
  extensionId: string;
  tabId: number;
  anchorRect: { x: number; y: number; width: number; height: number };
  alignment?: string;
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

type State = {
  activeTabId?: number;
  actions: Action[];
};

type __browserAction__ = {
  addEventListener(name: string, listener: (...args: any[]) => void): void;
  removeEventListener(name: string, listener: (...args: any[]) => void): void;
  getAction(extensionId: string): any;
  getState(partition: string): Promise<State>;
  activate: (partition: string, details: ActivateDetails) => Promise<unknown>;
  addObserver(partition: string): void;
  removeObserver(partition: string): void;
};

type BrowserActionIconProps = {
  action: Action;
  activeTabId: number;
  tabInfo: ExtensionAction | null;
};
function BrowserActionIcon({ action, activeTabId, tabInfo }: BrowserActionIconProps) {
  const { iconModified } = { ...action, ...tabInfo };

  const [isError, setIsError] = useState(false);
  const iconSize = 32;
  const resizeType = 2;
  const timeParam = iconModified ? `&t=${iconModified}` : "";
  const iconUrl = `crx://extension-icon/${action.id}/${iconSize}/${resizeType}?tabId=${activeTabId}${timeParam}`;

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
  const browserAction: __browserAction__ = (globalThis as any).browserAction;

  const buttonRef = useRef<HTMLButtonElement>(null);

  const tabInfo = activeTabId > -1 ? action.tabs[activeTabId] : null;

  const onActivated = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current) return;

      const button = buttonRef.current;

      const rect = button.getBoundingClientRect();

      // Prediction of Native Frame Size on Left Click
      const Y_PADDING = event.button === 0 ? 20 : 0;
      browserAction.activate(partition, {
        eventType: event.type,
        extensionId: action.id,
        tabId: activeTabId,
        alignment: alignment,
        anchorRect: {
          x: rect.left,
          y: rect.top + Y_PADDING,
          width: rect.width,
          height: rect.height
        }
      });
    },
    [action.id, activeTabId, alignment, browserAction, partition]
  );

  const onClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      return onActivated(event);
    },
    [onActivated]
  );

  const onContextMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();

      return onActivated(event);
    },
    [onActivated]
  );

  return (
    <div className="flex flex-row justify-between gap-0.5">
      <SidebarMenuButton id={action.id} ref={buttonRef} onClick={onClick} onContextMenu={onContextMenu}>
        <BrowserActionIcon action={action} activeTabId={activeTabId} tabInfo={tabInfo} />
        <Badge color={tabInfo?.color} text={tabInfo?.text} />
        <span className="font-semibold">{action.title}</span>
      </SidebarMenuButton>
      {/* TODO: Add pin functionality */}
      <Button variant="ghost" size="icon" disabled>
        <PinIcon className="size-4" />
      </Button>
    </div>
  );
}

export function BrowserActionList({
  partition = "_self",
  alignmentX = "left",
  alignmentY = "bottom"
}: BrowserActionListProps) {
  const browserAction: __browserAction__ = (globalThis as any).browserAction;

  const alignment = useMemo(() => {
    return `${alignmentX} ${alignmentY}`;
  }, [alignmentX, alignmentY]);

  const fetchState = useCallback(async () => {
    return browserAction.getState(partition);
  }, [browserAction, partition]);

  const [activeTabId, setActiveTabId] = useState<number | undefined>(undefined);
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    fetchState().then((state) => {
      setActions(state.actions);
      setActiveTabId(state.activeTabId);
    });
  }, [fetchState]);

  const onActionsUpdate = useCallback((state: State) => {
    setActions(state.actions);
    setActiveTabId(state.activeTabId);
  }, []);

  useEffect(() => {
    browserAction.addEventListener("update", onActionsUpdate);
    browserAction.addObserver(partition);

    return () => {
      browserAction.removeEventListener("update", onActionsUpdate);
      browserAction.removeObserver(partition);
    };
  }, [browserAction, partition, onActionsUpdate]);

  if (!activeTabId) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <SidebarMenuButton>
          <PuzzleIcon />
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 select-none">
        <SidebarMenu>
          {actions.map((action) => (
            <BrowserAction
              key={action.id}
              action={action}
              alignment={alignment}
              partition={partition}
              activeTabId={activeTabId}
            />
          ))}
        </SidebarMenu>
      </PopoverContent>
    </Popover>
  );
}
