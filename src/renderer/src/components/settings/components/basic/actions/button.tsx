import { cn } from "@/lib/utils";
import { Loader } from "../../icons/loader";
import { motion } from "motion/react";
import { useState } from "react";

function generateBlurStyle(blur: boolean) {
  return { "--tw-blur": blur ? "blur(4px)" : "blur(0px)" };
}

export function ButtonAction({
  className,
  text = "",
  loader = false,
  blur = false,
  disabled = false,
  onClick
}: {
  className?: string;
  text?: string;
  loader?: boolean;
  blur?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const [initialIsBlurred] = useState(() => generateBlurStyle(blur));

  return (
    <button
      className={cn(
        "h-6 px-6",
        "bg-black/10 dark:bg-white/10",
        !disabled && "active:bg-black/5 dark:active:bg-white/5",
        "text-sm rounded-md",
        className
      )}
      onClick={() => !disabled && onClick?.()}
      disabled={disabled}
    >
      <motion.div
        className="flex items-center justify-center gap-1 blur"
        initial={initialIsBlurred}
        animate={generateBlurStyle(blur)}
        transition={{ duration: 0.2 }}
      >
        {loader && <Loader className="size-4" />}
        {text && <span key={text}>{text}</span>}
      </motion.div>
    </button>
  );
}
