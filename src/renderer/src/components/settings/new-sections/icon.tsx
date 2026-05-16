import { usePlatform } from "@/components/main/platform";
import { useFocusedContext } from "@/components/settings/settings-layout";
import { getLiquidGlassLikeStyles } from "@/components/settings/sidebar";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

function NavigationButton({ direction }: { direction: "left" | "right" }) {
  const ChevronIcon = direction === "left" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <div
      className={cn(
        "w-7 h-full",
        "rounded-full",
        "hover:bg-black/5 hover:dark:bg-white/5",
        "flex items-center justify-center"
      )}
    >
      <ChevronIcon className="size-6" />
    </div>
  );
}

function NavigationButtons() {
  const { platform } = usePlatform();
  const isMac = platform === "darwin";

  const isFocused = useFocusedContext();

  return (
    <div
      className={cn(
        "w-16 h-full rounded-full p-1",
        "remove-app-drag",
        "flex items-center justify-between",
        "group",
        isMac && "border",
        isMac && getLiquidGlassLikeStyles(isFocused)
      )}
    >
      <NavigationButton direction="left" />
      {isMac && <div className={cn("w-px h-5 group-hover:hidden", "bg-gray-400/25 dark:bg-white/5")} />}
      <NavigationButton direction="right" />
    </div>
  );
}

function SettingsContentHeader() {
  return (
    <div className="h-9">
      <NavigationButtons />
    </div>
  );
}

export function IconSection() {
  return <SettingsContentHeader />;
}
