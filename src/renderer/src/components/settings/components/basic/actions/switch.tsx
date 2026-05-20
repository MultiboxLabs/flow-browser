import { useSettingsWindowContext } from "@/components/settings/context";
import { cn } from "@/lib/utils";

export function Switch({ active, onToggle }: { active: boolean; onToggle?: () => void }) {
  const { isMac } = useSettingsWindowContext();

  return (
    <button
      className={cn(
        "relative h-4 rounded-full",
        isMac ? "w-9" : "w-7.5",
        active ? "bg-[#147dff]" : "bg-black/10 dark:bg-white/10",
        "transition-colors duration-150",
        "focus-visible:outline-muted-foreground"
      )}
      onClick={onToggle}
    >
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full bg-white",
          isMac ? "h-3 w-5" : "size-2.5",
          isMac ? "left-0.5" : "left-1",
          "transition-transform duration-150 ease-out",
          active && (isMac ? "translate-x-3" : "translate-x-3")
        )}
      />
    </button>
  );
}
