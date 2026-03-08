import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { PinInCircle } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/normal/pin-in-circle";

function PinGridEmptyStateCloseButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      onClick={onDismiss}
      className="absolute top-1.5 right-1.5 p-0.5 rounded-md text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
    >
      <X className="size-3" />
    </button>
  );
}

interface PinGridEmptyStateProps {
  isDragOver: boolean;
  hidden: boolean;
  onDismiss: () => void;
}

export function PinGridEmptyState({ isDragOver, hidden, onDismiss }: PinGridEmptyStateProps) {
  if (hidden && !isDragOver) return <div className="h-1" />;
  return (
    <div
      className={cn(
        "col-span-full flex flex-col items-center justify-center relative",
        "p-4 rounded-xl",
        "border-2 border-dashed",
        "transition-colors duration-150",
        isDragOver
          ? "border-white/40 bg-white/10 dark:border-white/30 dark:bg-white/5"
          : "border-black/20 dark:border-white/20"
      )}
    >
      {!hidden && <PinGridEmptyStateCloseButton onDismiss={onDismiss} />}
      <PinInCircle className="size-4 text-black dark:text-white mb-0.5" />
      <span className="text-xs text-black dark:text-white select-none font-bold">Drag to pin tabs</span>
      <span className="text-xs text-black/50 dark:text-white/50 select-none font-medium text-center">
        Pinned tabs keep your must used sites and apps close
      </span>
    </div>
  );
}
