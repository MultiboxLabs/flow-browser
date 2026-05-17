import {
  useSettingsNavigationCanGoBack,
  useSettingsNavigationCanGoForward,
  useSettingsWindowContext
} from "@/components/settings/context";
import { getLiquidGlassLikeStyles } from "@/components/settings/sidebar";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface NavigationButtonProps {
  direction: "left" | "right";
  disabled?: boolean;
  onClick?: () => void;
}
function NavigationButton({ direction, disabled, onClick }: NavigationButtonProps) {
  const ChevronIcon = direction === "left" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      tabIndex={-1}
      className={cn(
        "size-7",
        "rounded-full",
        "flex items-center justify-center",
        disabled ? "opacity-40 cursor-default" : "hover:bg-black/10 hover:dark:bg-white/10",
        !disabled && "active:bg-black/5 dark:active:bg-white/5"
      )}
    >
      <ChevronIcon
        strokeWidth={1.5}
        className={cn(
          "relative size-6.5 text-black dark:text-white",
          direction === "left" ? "-left-0.5" : "-right-0.5"
        )}
      />
    </button>
  );
}

function NavigationButtons({ isMac }: { isMac: boolean }) {
  const { isFocused, navigationHistoryIndex, goTo } = useSettingsWindowContext();
  const canGoBack = useSettingsNavigationCanGoBack();
  const canGoForward = useSettingsNavigationCanGoForward();

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
      <NavigationButton
        direction="left"
        disabled={!canGoBack}
        onClick={canGoBack ? () => goTo(navigationHistoryIndex - 1) : undefined}
      />
      {isMac && <div className={cn("w-px h-5 group-hover:hidden", "bg-gray-400/25 dark:bg-white/5")} />}
      <NavigationButton
        direction="right"
        disabled={!canGoForward}
        onClick={canGoForward ? () => goTo(navigationHistoryIndex + 1) : undefined}
      />
    </div>
  );
}

export function SettingsContentHeader({ sectionLabel }: { sectionLabel: string | null }) {
  const { isMac } = useSettingsWindowContext();

  return (
    <div
      className={cn("absolute top-0 left-0 z-20 h-9 px-2", "flex items-center justify-between gap-2", !isMac && "pt-2")}
    >
      <NavigationButtons isMac={isMac} />
      <AnimatePresence>
        {sectionLabel && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="font-medium"
          >
            {sectionLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
