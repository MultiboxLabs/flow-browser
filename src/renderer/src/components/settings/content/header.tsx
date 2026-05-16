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
        "size-7",
        "rounded-full",
        "hover:bg-black/5 hover:dark:bg-white/5",
        "flex items-center justify-center"
      )}
    >
      <ChevronIcon className="size-6" />
    </div>
  );
}

function NavigationButtons({ isMac }: { isMac: boolean }) {
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

export function SettingsContentHeader() {
  const { platform } = usePlatform();
  const isMac = platform === "darwin";

  return (
    <div
      className={cn("absolute top-0 left-0 z-20 h-9 px-2", "flex items-center justify-between gap-2", !isMac && "pt-2")}
    >
      <NavigationButtons isMac={isMac} />
      <span className="font-medium">Icons</span>
    </div>
  );
}
