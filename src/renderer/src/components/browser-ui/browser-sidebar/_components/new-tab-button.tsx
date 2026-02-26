import { motion } from "motion/react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <Plus className="size-4" strokeWidth={3} />
      <span className="font-medium text-sm">New Tab</span>
    </motion.button>
  );
}
