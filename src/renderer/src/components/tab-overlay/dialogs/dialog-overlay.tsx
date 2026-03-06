import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { TabDialogRequest } from "~/types/tab-dialogs";
import { useTabOverlay } from "../provider";
import { AlertDialogContent } from "./alert-dialog";
import { ConfirmDialogContent } from "./confirm-dialog";
import { PromptDialogContent } from "./prompt-dialog";

interface DialogOverlayProps {
  request: TabDialogRequest;
}

export function DialogOverlay({ request }: DialogOverlayProps) {
  const { respondToDialog, suppressDialogs } = useTabOverlay();
  const [preventMore, setPreventMore] = useState(false);

  const handleDismiss = () => {
    if (preventMore) {
      suppressDialogs(request.tabId);
    }
  };

  const handleAlertOk = () => {
    handleDismiss();
    respondToDialog(request.dialogId, { type: "alert" });
  };

  const handleConfirm = (confirmed: boolean) => {
    handleDismiss();
    respondToDialog(request.dialogId, { type: "confirm", confirmed });
  };

  const handlePrompt = (value: string | null) => {
    handleDismiss();
    respondToDialog(request.dialogId, { type: "prompt", value });
  };

  return (
    <AnimatePresence>
      <motion.div
        key={request.dialogId}
        className="absolute inset-0 pointer-events-auto flex items-center justify-center overflow-hidden"
        style={{ borderRadius: "inherit" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <motion.div
          className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="p-5">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 truncate">A page says:</p>

            {request.type === "alert" && <AlertDialogContent message={request.message} onOk={handleAlertOk} />}
            {request.type === "confirm" && <ConfirmDialogContent message={request.message} onConfirm={handleConfirm} />}
            {request.type === "prompt" && (
              <PromptDialogContent
                message={request.message}
                defaultValue={request.defaultValue}
                onSubmit={handlePrompt}
              />
            )}
          </div>

          <div className="px-5 pb-4">
            <label className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={preventMore}
                onChange={(e) => setPreventMore(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-600"
              />
              Prevent this page from creating additional dialogs
            </label>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
