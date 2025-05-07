import { copyTextToClipboard } from "@/lib/utils";
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { useTabs } from "./tabs-provider";
import { useToast } from "@/components/providers/minimal-toast-provider";
// Type for the payload of onIncomingAction, based on src/main/ipc/app/actions.ts
type IncomingActionPayload = string;

interface ActionsContextValue {
  /**
   * Triggers a request to copy the given link/text to the clipboard.
   * Assumes an underlying API like flow.actions.triggerCopy(link).
   */
  copyLink: () => Promise<void>; // Adjusted to reflect user's change (no linkToCopy param)

  /**
   * Handles an incoming action. This function is also registered as the listener
   * for flow.actions.onIncomingAction.
   */
  handleIncomingAction: (action: IncomingActionPayload) => void;
}

const ActionsContext = createContext<ActionsContextValue | null>(null);

export const useActions = (): ActionsContextValue => {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error("useActions must be used within an ActionsProvider");
  }
  return context;
};

interface ActionsProviderProps {
  children: ReactNode;
}

export const ActionsProvider = ({ children }: ActionsProviderProps) => {
  const { addressUrl } = useTabs();
  const { showToast } = useToast();

  // User has updated this function, leaving as is with TODO.
  const copyLink = useCallback(async (): Promise<void> => {
    if (!addressUrl) return;

    copyTextToClipboard(addressUrl, false).then((success) => {
      if (success) {
        showToast("Copied to clipboard!");
      }
    });
  }, [addressUrl, showToast]);

  const copyLinkCallbackRef = useRef<typeof copyLink>(copyLink);
  copyLinkCallbackRef.current = copyLink;

  // Exposed method, also used as a callback for the onIncomingAction event
  const handleIncomingAction = useCallback((action: IncomingActionPayload) => {
    console.log("ActionsProvider: handleIncomingAction received:", action);
    // TODO: handle generic incoming actions
  }, []);

  const handleIncomingActionCallbackRef = useRef<typeof handleIncomingAction>(handleIncomingAction);
  handleIncomingActionCallbackRef.current = handleIncomingAction;

  // Listener for the onCopyLink event from the main process
  useEffect(() => {
    const unsubscribe = flow.actions.onCopyLink(() => {
      return copyLinkCallbackRef.current();
    });
    return () => {
      unsubscribe();
    };
  }, [copyLinkCallbackRef]);

  // Listener for the onIncomingAction event from the main process
  useEffect(() => {
    const unsubscribe = flow.actions.onIncomingAction((action) => {
      return handleIncomingActionCallbackRef.current(action);
    });
    return () => {
      unsubscribe();
    };
  }, [handleIncomingActionCallbackRef]);

  return (
    <ActionsContext.Provider
      value={{
        copyLink,
        handleIncomingAction
      }}
    >
      {children}
    </ActionsContext.Provider>
  );
};
