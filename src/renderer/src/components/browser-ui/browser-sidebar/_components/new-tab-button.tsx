import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M13.5 4a1.5 1.5 0 0 0-3 0v6.5H4a1.5 1.5 0 0 0 0 3h6.5V20a1.5 1.5 0 0 0 3 0v-6.5H20a1.5 1.5 0 0 0 0-3h-6.5V4Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function NewTabButton() {
  const [isPressed, setIsPressed] = useState(false);

  const handleNewTab = () => {
    flow.newTab.open();
  };

  return (
    <motion.button
      onClick={handleNewTab}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      animate={{ scale: isPressed ? 0.99 : 1 }}
      transition={{ scale: { type: "spring", stiffness: 600, damping: 20 } }}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md w-full",
        "bg-transparent hover:bg-black/10 dark:hover:bg-white/10",
        "text-black/50 dark:text-white/50 cursor-pointer"
      )}
    >
      <PlusIcon className="size-4" />
      <span className="font-medium text-sm">New Tab</span>
    </motion.button>
  );
}
