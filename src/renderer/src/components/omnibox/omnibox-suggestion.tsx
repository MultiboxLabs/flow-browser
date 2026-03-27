import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import type { OmniboxSuggestion } from "@/lib/omnibox-new/types";
import { WebsiteFavicon } from "@/components/main/website-favicon";
import { cn } from "@/lib/utils";
import { PedalGlyph } from "@/components/omnibox/pedal-glyph";
import { generateTitleFromUrl } from "@/lib/omnibox-new/helpers";

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
    // case "search":
    //   return { label: "Search", show: true };
    // case "website":
    //   return { label: "Open", show: true };
    default:
      return { label: "", show: false };
  }
}

interface SuggestionIconProps {
  suggestion: OmniboxSuggestion;
  selected: boolean;
  faviconUrl: string | null;
  setHasLoadedFavicon: (loaded: boolean) => void;
  className?: string;
}
function SuggestionIcon({
  suggestion,
  selected,
  faviconUrl,
  setHasLoadedFavicon,
  className
}: SuggestionIconProps): React.ReactNode {
  if (suggestion.type === "pedal") {
    return <PedalGlyph className={className} action={suggestion.action} selected={selected} />;
  }
  if (suggestion.type === "search") {
    return <Search className={cn("size-3.5 text-zinc-600 dark:text-zinc-100", className)} strokeWidth={2} />;
  }
  if (faviconUrl) {
    return (
      <WebsiteFavicon
        url={faviconUrl}
        className={cn("size-4 object-cover rounded-[2px] text-zinc-600 dark:text-zinc-100", className)}
        cacheOnly
        onLoadedChange={setHasLoadedFavicon}
      />
    );
  }
  return <Search className={cn("size-3.5 text-zinc-600 dark:text-zinc-100", className)} strokeWidth={2} />;
}

export type OmniboxSuggestionRowProps = {
  suggestion: OmniboxSuggestion;
  index: number;
  selected: boolean;
  onSelect: (suggestion: OmniboxSuggestion) => void;
};

export function OmniboxSuggestionRow({ suggestion, index, selected, onSelect }: OmniboxSuggestionRowProps) {
  const [hasLoadedFavicon, setHasLoadedFavicon] = useState(false);
  const faviconUrl = pageUrlForFavicon(suggestion);
  const title = primaryLabel(suggestion);
  const { label: actionLabel, show: showAction } = actionHint(suggestion);

  const generatedUrlTitle = suggestion.type === "website" ? generateTitleFromUrl(suggestion.url) : null;
  return (
    <div
      id={`omnibox-option-${index}`}
      role="option"
      aria-selected={selected}
      data-index={index}
      tabIndex={-1}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      onClick={() => {
        onSelect(suggestion);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(suggestion);
        }
      }}
      className="cursor-default outline-none"
    >
      <div
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[10px] text-left",
          "px-2.5 py-3",
          selected
            ? "bg-black/8 dark:bg-space-background-start/50"
            : "bg-transparent hover:bg-black/4 dark:hover:bg-white/4"
        )}
      >
        <span
          className={cn(
            "flex size-6 shrink-0",
            "items-center justify-center overflow-hidden",
            selected && hasLoadedFavicon ? "rounded-[2px] bg-white dark:bg-white" : "bg-transparent"
          )}
        >
          <SuggestionIcon
            suggestion={suggestion}
            selected={selected}
            faviconUrl={faviconUrl}
            setHasLoadedFavicon={setHasLoadedFavicon}
          />
        </span>
        <span className={cn("min-w-0 flex-1 truncate font-sans text-[14px] font-medium leading-tight")}>
          <span className={cn(selected ? "text-zinc-950 dark:text-white" : "text-zinc-700 dark:text-zinc-200")}>
            {title}
          </span>
          {suggestion.type === "website" && title !== generatedUrlTitle && (
            <span className={cn(selected ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-500 dark:text-zinc-400")}>
              {` — ${generatedUrlTitle}`}
            </span>
          )}
        </span>
        {showAction ? (
          <span className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "hidden font-sans text-[12px] sm:inline font-medium",
                selected ? "text-zinc-700 dark:text-white/90" : "text-zinc-500 dark:text-zinc-500"
              )}
            >
              {actionLabel}
            </span>
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-sm",
                selected
                  ? "bg-white text-zinc-700 dark:text-space-background-start"
                  : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              )}
            >
              <ArrowRight className="size-4" strokeWidth={3} aria-hidden />
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
