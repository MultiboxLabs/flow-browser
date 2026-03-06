import { TabOverlayPortal } from "@/components/browser-ui/tab-overlays/tab-overlay-portal";
import { useTabs } from "@/components/providers/tabs-provider";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TabDialogResponse, TabDialogState } from "~/types/tab-dialogs";

function getDialogOriginLabel(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname) {
      return parsed.hostname;
    }
    return parsed.protocol.replace(":", "");
  } catch {
    return null;
  }
}

function JavaScriptDialogCard({
  dialog,
  originLabel,
  onRespond
}: {
  dialog: TabDialogState;
  originLabel: string | null;
  onRespond: (dialogId: string, response: TabDialogResponse) => void;
}) {
  const [promptValue, setPromptValue] = useState(dialog.defaultPromptText);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPromptValue(dialog.defaultPromptText);
  }, [dialog.defaultPromptText, dialog.id]);

  useEffect(() => {
    const target = dialog.type === "prompt" ? promptInputRef.current : primaryButtonRef.current;
    if (!target) return;

    const frameId = window.requestAnimationFrame(() => {
      target.focus();
      if (target instanceof HTMLInputElement) {
        target.select();
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [dialog.id, dialog.type]);

  const handleAccept = useCallback(() => {
    onRespond(dialog.id, {
      accept: true,
      promptText: dialog.type === "prompt" ? promptValue : undefined
    });
  }, [dialog.id, dialog.type, onRespond, promptValue]);

  const handleCancel = useCallback(() => {
    if (dialog.type === "alert") return;
    onRespond(dialog.id, { accept: false });
  }, [dialog.id, dialog.type, onRespond]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dialog.type !== "alert") {
        event.preventDefault();
        handleCancel();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        handleAccept();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialog.type, handleAccept, handleCancel]);

  const confirmLabel = dialog.type === "alert" ? "OK" : "Continue";

  return (
    <div className="w-full h-full bg-black/30 backdrop-blur-[2px] pointer-events-auto flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className={cn(
          "w-full max-w-md",
          "rounded-2xl border border-white/12 bg-neutral-950/96 text-white",
          "shadow-2xl shadow-black/40",
          "px-5 py-4"
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">This page says</p>
            {originLabel ? <p className="text-xs text-white/45">{originLabel}</p> : null}
          </div>

          <p className="text-sm leading-6 text-white/88 whitespace-pre-wrap break-words">{dialog.messageText}</p>

          {dialog.type === "prompt" ? (
            <input
              ref={promptInputRef}
              value={promptValue}
              onChange={(event) => setPromptValue(event.target.value)}
              className={cn(
                "h-10 w-full rounded-xl border border-white/12 bg-white/8 px-3",
                "text-sm text-white outline-none",
                "focus:border-white/25 focus:bg-white/10"
              )}
            />
          ) : null}

          <div className="flex items-center justify-end gap-2">
            {dialog.type !== "alert" ? (
              <button
                type="button"
                onClick={handleCancel}
                className={cn(
                  "h-9 rounded-lg px-3 text-sm font-medium text-white/75",
                  "border border-white/12 bg-white/5 hover:bg-white/10 hover:text-white",
                  "transition-colors duration-150"
                )}
              >
                Cancel
              </button>
            ) : null}

            <button
              ref={primaryButtonRef}
              type="button"
              onClick={handleAccept}
              className={cn(
                "h-9 rounded-lg px-3 text-sm font-medium",
                "bg-white text-black hover:bg-white/90",
                "transition-colors duration-150"
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function JavaScriptDialogsOverlay() {
  const { tabsData } = useTabs();
  const [dialogs, setDialogs] = useState<TabDialogState[]>([]);

  useEffect(() => {
    let isMounted = true;

    void flow.tabDialogs.getState().then((state) => {
      if (isMounted) {
        setDialogs(state);
      }
    });

    const unsubscribe = flow.tabDialogs.onStateChanged((state) => {
      setDialogs(state);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const tabsById = useMemo(() => {
    return new Map((tabsData?.tabs ?? []).map((tab) => [tab.id, tab]));
  }, [tabsData]);

  const handleRespond = useCallback((dialogId: string, response: TabDialogResponse) => {
    void flow.tabDialogs.respond(dialogId, response);
  }, []);

  return (
    <>
      {dialogs.map((dialog) => {
        const tab = tabsById.get(dialog.tabId);
        const originLabel = getDialogOriginLabel(tab?.url ?? "");

        return (
          <TabOverlayPortal key={dialog.id} tabId={dialog.tabId} autoFocus className="pointer-events-auto">
            <JavaScriptDialogCard dialog={dialog} originLabel={originLabel} onRespond={handleRespond} />
          </TabOverlayPortal>
        );
      })}
    </>
  );
}
