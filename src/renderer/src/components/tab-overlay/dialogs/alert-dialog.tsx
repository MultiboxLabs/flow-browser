import { useEffect, useRef } from "react";

interface AlertDialogContentProps {
  message: string;
  onOk: () => void;
}

export function AlertDialogContent({ message, onOk }: AlertDialogContentProps) {
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    okRef.current?.focus();
  }, []);

  return (
    <div>
      <p className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words mb-4">{message}</p>
      <div className="flex justify-end">
        <button
          ref={okRef}
          onClick={onOk}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
