import { useEffect, useRef } from "react";

interface ConfirmDialogContentProps {
  message: string;
  onConfirm: (confirmed: boolean) => void;
}

export function ConfirmDialogContent({ message, onConfirm }: ConfirmDialogContentProps) {
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    okRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onConfirm(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onConfirm]);

  return (
    <div>
      <p className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => onConfirm(false)}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors"
        >
          Cancel
        </button>
        <button
          ref={okRef}
          onClick={() => onConfirm(true)}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
