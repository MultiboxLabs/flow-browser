import { TabOverlayPortal } from "@/components/browser-ui/tab-overlays/tab-overlay-portal";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangleIcon, CheckIcon, LucideIcon, PencilIcon } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TabDialogResponse, TabDialogState } from "~/types/tab-dialogs";

const MotionCard = motion.create(Card);

function getDialogIcon(type: TabDialogState["type"]): LucideIcon | null {
  switch (type) {
    case "alert":
      return AlertTriangleIcon;
    case "confirm":
      return CheckIcon;
    case "prompt":
      return PencilIcon;
    default:
      return null;
  }
}

function getDialogTitle(type: TabDialogState["type"]): "Alert" | "Confirm" | "Prompt" {
  switch (type) {
    case "alert":
      return "Alert";
    case "confirm":
      return "Confirm";
    case "prompt":
      return "Prompt";
  }
}

function JavaScriptDialogCard({
  dialog,
  onRespond
}: {
  dialog: TabDialogState;
  onRespond: (dialogId: string, response: TabDialogResponse) => void;
}) {
  const [promptValue, setPromptValue] = useState(dialog.defaultPromptText);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);
  const DialogIcon = getDialogIcon(dialog.type);
  const dialogTitle = getDialogTitle(dialog.type);
  const isPrompt = dialog.type === "prompt";

  useEffect(() => {
    setPromptValue(dialog.defaultPromptText);
  }, [dialog.defaultPromptText, dialog.id]);

  useEffect(() => {
    const target = isPrompt ? promptInputRef.current : primaryButtonRef.current;
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
  }, [dialog.id, isPrompt]);

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
    const isEscapeKey = (event: KeyboardEvent) =>
      event.key === "Escape" || event.key === "Esc" || event.code === "Escape";
    const isEnterKey = (event: KeyboardEvent) =>
      event.key === "Enter" || event.code === "Enter" || event.code === "NumpadEnter";

    const handleKeyEvent = (event: KeyboardEvent) => {
      if (isEscapeKey(event) && dialog.type !== "alert") {
        event.preventDefault();
        event.stopPropagation();
        handleCancel();
      }

      if (isEnterKey(event)) {
        event.preventDefault();
        event.stopPropagation();
        handleAccept();
      }
    };

    window.addEventListener("keydown", handleKeyEvent, { capture: true });
    window.addEventListener("keyup", handleKeyEvent, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyEvent, { capture: true });
      window.removeEventListener("keyup", handleKeyEvent, { capture: true });
    };
  }, [dialog.type, handleAccept, handleCancel]);

  const confirmLabel = dialog.type === "alert" ? "OK" : "Continue";

  return (
    <div
      className={cn(
        "w-full h-full bg-black/30 backdrop-blur-[2px] pointer-events-auto flex items-center justify-center",
        isPrompt ? "p-8" : "p-6"
      )}
      style={{ borderRadius: "inherit" }}
    >
      <MotionCard
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="w-full max-w-md gap-2 border-white/12 bg-neutral-950/96 text-white shadow-2xl shadow-black/40"
      >
        <CardHeader className="pb-0">
          <CardTitle className="text-xl text-white flex items-center gap-2">
            {DialogIcon ? <DialogIcon className="size-6" /> : null}
            {dialogTitle}
          </CardTitle>
        </CardHeader>

        <CardContent className={cn(isPrompt && "flex flex-col gap-4")}>
          <p className="text-sm leading-6 text-white/88 whitespace-pre-wrap wrap-break-word">{dialog.messageText}</p>

          {isPrompt ? (
            <input
              ref={promptInputRef}
              value={promptValue}
              onChange={(event) => setPromptValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.code === "Enter" || event.code === "NumpadEnter") {
                  event.preventDefault();
                  event.stopPropagation();
                  handleAccept();
                } else if (event.key === "Escape" || event.key === "Esc" || event.code === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  handleCancel();
                }
              }}
              className={cn(
                "h-11 w-full rounded-lg border border-white/12 bg-white/8 px-4",
                "text-sm text-white outline-none",
                "focus:border-white/25 focus:bg-white/10"
              )}
            />
          ) : null}
        </CardContent>

        <CardFooter className="justify-end gap-2">
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
        </CardFooter>
      </MotionCard>
    </div>
  );
}

export function JavaScriptDialogsOverlay() {
  const [dialogs, setDialogs] = useState<TabDialogState[]>([]);
  const previousDialogsRef = useRef<Map<string, number>>(new Map());

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

  const handleRespond = useCallback((dialogId: string, response: TabDialogResponse) => {
    void flow.tabDialogs.respond(dialogId, response);
  }, []);

  useEffect(() => {
    const currentDialogs = new Map(dialogs.map((dialog) => [dialog.id, dialog.tabId]));
    const removedTabIds: number[] = [];

    for (const [dialogId, tabId] of previousDialogsRef.current) {
      if (!currentDialogs.has(dialogId)) {
        removedTabIds.push(tabId);
      }
    }

    previousDialogsRef.current = currentDialogs;

    const tabIdToFocus = removedTabIds[removedTabIds.length - 1];
    if (tabIdToFocus === undefined) return;

    const focusFrame = window.requestAnimationFrame(() => {
      flow.interface.focusTab(tabIdToFocus);
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
    };
  }, [dialogs]);

  return (
    <>
      {dialogs.map((dialog) => {
        return (
          <TabOverlayPortal key={dialog.id} tabId={dialog.tabId} autoFocus className="pointer-events-auto">
            <JavaScriptDialogCard dialog={dialog} onRespond={handleRespond} />
          </TabOverlayPortal>
        );
      })}
    </>
  );
}
