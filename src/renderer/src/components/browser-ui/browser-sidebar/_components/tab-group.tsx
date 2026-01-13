import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { useState } from "react";

export function TabGroup() {
  const isActive = false;
  const [closeButtonPressing, setCloseButtonPressing] = useState(false);
  const [tabGroupPressing, setTabGroupPressing] = useState(false);

  return (
    <div
      className={cn(
        "group hover:bg-black/10 dark:hover:bg-white/10 h-8 w-full rounded-lg",
        "flex items-center gap-2 px-2",
        "transition-transform",
        tabGroupPressing ? "scale-99" : "scale-100",
        isActive && "bg-black/15! dark:bg-white/15!"
      )}
      onMouseEnter={() => {
        setTabGroupPressing(false);
        setCloseButtonPressing(false);
      }}
      onMouseDown={() => {
        setTabGroupPressing(true);
      }}
      onMouseUp={() => {
        setTabGroupPressing(false);
      }}
    >
      <img src="https://www.google.com/favicon.ico" className="size-4 shrink-0" />
      <span className="flex-1 text-sm font-medium text-black/80 dark:text-white/80 truncate">Google</span>
      <button
        className={cn(
          "size-5.5 shrink-0 rounded-sm p-0.5",
          "opacity-0 group-hover:opacity-100",
          "hover:bg-black/10 dark:hover:bg-white/10",
          "transition-transform",
          closeButtonPressing ? "scale-95" : "scale-100",
          closeButtonPressing && "bg-black/15! dark:bg-white/15!"
        )}
        onMouseDown={(e) => {
          e.stopPropagation();
          setCloseButtonPressing(true);
        }}
        onMouseUp={() => {
          setCloseButtonPressing(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          // Handle close
        }}
      >
        <XIcon className="size-4.5 text-black/60 dark:text-white/60" />
      </button>
    </div>
  );
}
