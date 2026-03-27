import { cn } from "@/lib/utils";
import { HistoryIcon, AppWindowIcon, PuzzleIcon, SettingsIcon, ShieldIcon, LinkIcon } from "lucide-react";

export function PedalGlyph({ action, selected, className }: { action: string; selected: boolean; className?: string }) {
  const cls = cn(
    "size-5 shrink-0",
    selected ? "text-zinc-950 dark:text-white" : "text-zinc-500 dark:text-zinc-400",
    className
  );
  switch (action) {
    case "open_settings":
      return <SettingsIcon className={cls} strokeWidth={2} />;
    case "open_new_window":
      return <AppWindowIcon className={cls} strokeWidth={2} />;
    case "open_incognito_window":
      return <ShieldIcon className={cls} strokeWidth={2} />;
    case "open_extensions":
      return <PuzzleIcon className={cls} strokeWidth={2} />;
    case "open_history":
      return <HistoryIcon className={cls} strokeWidth={2} />;
    default:
      return <LinkIcon className={cls} strokeWidth={2} />;
  }
}
