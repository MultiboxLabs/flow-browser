import { useSpaces } from "@/components/providers/spaces-provider";
import { useTabs } from "@/components/providers/tabs-provider";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

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

interface BrowserActionState {
  activeTabId?: number;
  actions: Action[];
}

interface ActivateDetails {
  eventType: string;
  extensionId: string;
  tabId: number;
  anchorRect: { x: number; y: number; width: number; height: number };
  alignment?: string;
}

type __browserAction__ = {
  addEventListener(name: string, listener: (state: BrowserActionState) => void): void;
  removeEventListener(name: string, listener: (state: BrowserActionState) => void): void;
  getAction(extensionId: string): unknown;
  getState(partition: string): Promise<BrowserActionState>;
  activate: (partition: string, details: ActivateDetails) => Promise<unknown>;
  addObserver(partition: string): void;
  removeObserver(partition: string): void;
};

interface BrowserActionContextType {
  activeTabId?: number;
  actions: Action[];
  activate: (extensionId: string, tabId: number, element: HTMLElement, alignment: string) => void;
  isLoading: boolean;
  partition: string;
}

interface BrowserActionProviderProps {
  children: ReactNode;
  partition?: string;
  disabled?: boolean;
}

const BrowserActionContext = createContext<BrowserActionContextType | null>(null);

function InternalBrowserActionProvider({
  children,
  partition = "_self",
  disabled = false
}: BrowserActionProviderProps) {
  const browserAction = (globalThis as { browserAction?: __browserAction__ }).browserAction;
  const [state, setState] = useState<BrowserActionState>({ actions: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchState = useCallback(async () => {
    if (!browserAction || disabled) return { actions: [] };
    return browserAction.getState(partition);
  }, [browserAction, partition, disabled]);

  useEffect(() => {
    if (disabled) {
      setState({ actions: [] });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchState().then((newState) => {
      setState(newState);
      setIsLoading(false);
    });
  }, [fetchState, disabled]);

  const onActionsUpdate = useCallback(
    (newState: BrowserActionState) => {
      if (disabled) return;
      setState(newState);
    },
    [disabled]
  );

  useEffect(() => {
    if (!browserAction || disabled) return;

    const updateListener = (newState: BrowserActionState) => {
      onActionsUpdate(newState);
    };

    browserAction.addEventListener("update", updateListener);
    browserAction.addObserver(partition);

    return () => {
      browserAction.removeEventListener("update", updateListener);
      browserAction.removeObserver(partition);
    };
  }, [browserAction, partition, onActionsUpdate, disabled]);

  const activate = useCallback(
    (extensionId: string, tabId: number, element: HTMLElement, alignment: string) => {
      if (!browserAction || disabled) return;

      const rect = element.getBoundingClientRect();

      // Padding adjustment for native frame
      const Y_PADDING = 20;

      browserAction.activate(partition, {
        eventType: "click",
        extensionId,
        tabId,
        alignment,
        anchorRect: {
          x: rect.left,
          y: rect.top + Y_PADDING,
          width: rect.width,
          height: rect.height
        }
      });
    },
    [browserAction, partition, disabled]
  );

  const value = {
    activeTabId: disabled ? undefined : state.activeTabId,
    actions: disabled ? [] : state.actions || [],
    activate,
    isLoading: disabled ? false : isLoading,
    partition
  };

  return <BrowserActionContext.Provider value={value}>{children}</BrowserActionContext.Provider>;
}

export function BrowserActionProvider({ children }: BrowserActionProviderProps) {
  const { currentSpace } = useSpaces();
  const { focusedTab } = useTabs();

  const currentProfileId = currentSpace?.profileId;

  const disabled = !currentProfileId || !focusedTab;
  const partition = currentProfileId ? `profile:${currentProfileId}` : "_self";

  return (
    <InternalBrowserActionProvider partition={partition} disabled={disabled}>
      {children}
    </InternalBrowserActionProvider>
  );
}

export function useBrowserAction(): BrowserActionContextType {
  const context = useContext(BrowserActionContext);
  if (context === null) {
    return {
      activeTabId: undefined,
      actions: [],
      activate: () => {},
      isLoading: false,
      partition: "_self"
    };
  }
  return context;
}
