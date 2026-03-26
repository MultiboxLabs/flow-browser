import { AppWindow, ChevronRight, History, Puzzle, Search, Settings, Shield } from "lucide-react";
import type { OmniboxSuggestion } from "@/lib/omnibox-new/types";
import { WebsiteFavicon } from "@/components/main/website-favicon";
import { cn } from "@/lib/utils";

function pageUrlForFavicon(suggestion: OmniboxSuggestion): string | null {
  switch (suggestion.type) {
    case "website":
    case "open-tab":
      return suggestion.url;
    case "search":
      return null;
    default:
      return null;
  }
}

function primaryLabel(suggestion: OmniboxSuggestion): string {
  switch (suggestion.type) {
    case "search":
      return suggestion.query;
    case "website":
      return suggestion.title;
    case "open-tab":
      return suggestion.title;
    case "pedal":
      return suggestion.title;
  }
}

function actionHint(suggestion: OmniboxSuggestion): { label: string; show: boolean } {
  switch (suggestion.type) {
    case "open-tab":
      return { label: "Switch to Tab", show: true };
    case "search":
      return { label: "Search", show: true };
    case "website":
      return { label: "Open", show: true };
    default:
      return { label: "", show: false };
  }
}

function PedalGlyph({ action, selected }: { action: string; selected: boolean }) {
  const cls = cn("size-5 shrink-0", selected ? "text-white" : "text-zinc-400");
  switch (action) {
    case "open_settings":
      return <Settings className={cls} strokeWidth={2} />;
    case "open_new_window":
      return <AppWindow className={cls} strokeWidth={2} />;
    case "open_incognito_window":
      return <Shield className={cls} strokeWidth={2} />;
    case "open_extensions":
      return <Puzzle className={cls} strokeWidth={2} />;
    case "open_history":
      return <History className={cls} strokeWidth={2} />;
    default:
      return <Search className={cls} strokeWidth={2} />;
  }
}

export type OmniboxSuggestionRowProps = {
  suggestion: OmniboxSuggestion;
  index: number;
  selected: boolean;
  onSelect: (suggestion: OmniboxSuggestion) => void;
};

export function OmniboxSuggestionRow({ suggestion, index, selected, onSelect }: OmniboxSuggestionRowProps) {
  const faviconUrl = pageUrlForFavicon(suggestion);
  const title = primaryLabel(suggestion);
  const { label: actionLabel, show: showAction } = actionHint(suggestion);

  return (
    <div
      id={`omnibox-option-${index}`}
      role="option"
      aria-selected={selected}
      data-index={index}
      tabIndex={-1}
      onClick={(e) => {
        (e.currentTarget as HTMLDivElement).focus({ preventScroll: true });
        onSelect(suggestion);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(suggestion);
        }
      }}
      className="cursor-default pb-1 outline-none"
    >
      <div
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[10px] text-left",
          "px-3.5 py-2.5",
          selected ? "bg-[#7C3AED]" : "bg-transparent hover:bg-white/4"
        )}
      >
        <span
          className={cn(
            "flex size-6 shrink-0",
            "items-center justify-center overflow-hidden",
            selected && faviconUrl ? "bg-white rounded-[2px]" : "bg-transparent"
          )}
        >
          {suggestion.type === "pedal" ? (
            <PedalGlyph action={suggestion.action} selected={selected} />
          ) : faviconUrl ? (
            <WebsiteFavicon url={faviconUrl} className="size-4 object-cover rounded-[2px]" />
          ) : (
            <Search className="size-3.5 text-zinc-100" strokeWidth={2} />
          )}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate font-sans text-[14px] font-medium leading-tight",
            selected ? "text-white" : "text-zinc-200"
          )}
        >
          {title}
        </span>
        {showAction ? (
          <span className="flex shrink-0 items-center gap-2">
            <span
              className={cn("hidden font-sans text-[12px] sm:inline", selected ? "text-white/90" : "text-zinc-500")}
            >
              {actionLabel}
            </span>
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg",
                selected ? "bg-white text-[#7C3AED]" : "bg-zinc-800 text-zinc-500"
              )}
            >
              <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden />
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
