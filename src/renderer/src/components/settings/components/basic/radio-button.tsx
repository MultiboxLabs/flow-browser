import { cn } from "@/lib/utils";
import { useSettingsWindowContext } from "@/components/settings/context";

export function RadioButton({ active }: { active: boolean }) {
  const { isMac, isFocused } = useSettingsWindowContext();

  const activeClass = isFocused ? "bg-[#147dff]" : "bg-[#4a4749]";

  return (
    <button
      className={cn(
        "size-4 rounded-full",
        active ? activeClass : "bg-black/10 dark:bg-white/10",
        "flex items-center justify-center"
      )}
    >
      {active && <div className={cn("rounded-full bg-white", isMac ? "size-1.5" : "size-2.5")} />}
    </button>
  );
}
