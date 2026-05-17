import { cn } from "@/lib/utils";
import { useSettingsWindowContext } from "@/components/settings/context";

export function RadioButton({ active }: { active: boolean }) {
  const { isMac } = useSettingsWindowContext();

  return (
    <div
      className={cn(
        "size-4 rounded-full",
        active ? "bg-[#147dff]" : "bg-black/10 dark:bg-white/10",
        "flex items-center justify-center"
      )}
    >
      {active && <div className={cn("rounded-full bg-white", isMac ? "size-1.5" : "size-2.5")} />}
    </div>
  );
}
