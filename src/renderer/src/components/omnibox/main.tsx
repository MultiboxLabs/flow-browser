import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { getOmniboxSuggestions } from "@/lib/omnibox-new";
import type { OmniboxSuggestion } from "@/lib/omnibox-new/types";
import { OmniboxSuggestionRow } from "@/components/omnibox/omnibox-suggestion";
import { createSearchUrl } from "@/lib/search";
import { cn } from "@/lib/utils";

function readOmniboxSearchParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    currentInput: params.get("currentInput") ?? "",
    openIn: params.get("openIn") === "new_tab" ? ("new_tab" as const) : ("current" as const)
  };
}

function commitSuggestion(suggestion: OmniboxSuggestion, openIn: "current" | "new_tab") {
  switch (suggestion.type) {
    case "open-tab":
      flow.tabs.switchToTab(suggestion.tabId);
      break;
    case "pedal": {
      const a = suggestion.action;
      if (a === "open_settings") {
        flow.windows.openSettingsWindow();
      } else if (a === "open_new_window") {
        flow.browser.createWindow();
      } else if (a === "open_incognito_window") {
        flow.browser.createIncognitoWindow();
      } else if (a === "open_extensions") {
        flow.tabs.newTab("flow://extensions", true);
      } else if (a === "open_history") {
        flow.tabs.newTab("flow://history", true);
      }
      break;
    }
    case "search": {
      const url = createSearchUrl(suggestion.query);
      if (openIn === "current") {
        flow.navigation.goTo(url, undefined, true);
      } else {
        flow.tabs.newTab(url, true, undefined, true);
      }
      break;
    }
    case "website": {
      const url = suggestion.url;
      if (openIn === "current") {
        flow.navigation.goTo(url, undefined, true);
      } else {
        flow.tabs.newTab(url, true, undefined, true);
      }
      break;
    }
  }
  flow.omnibox.hide();
}

export function OmniboxMain() {
  const { currentInput: initialInput, openIn } = useMemo(() => readOmniboxSearchParams(), []);
  const [inputValue, setInputValue] = useState(initialInput);
  const [suggestions, setSuggestions] = useState<OmniboxSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const flushSuggestions = useCallback((items: OmniboxSuggestion[]) => {
    setSuggestions(items);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    getOmniboxSuggestions(inputValue, flushSuggestions);
  }, [inputValue, flushSuggestions]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }, []);

  const commitSelected = useCallback(
    (suggestion: OmniboxSuggestion) => {
      commitSuggestion(suggestion, openIn);
    },
    [openIn]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      flow.omnibox.hide();
      return;
    }
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = suggestions[selectedIndex];
      if (row) commitSelected(row);
    }
  };

  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const suggestionKey = (s: OmniboxSuggestion, index: number) => {
    switch (s.type) {
      case "search":
        return `search-${s.query}-${index}`;
      case "website":
        return `web-${s.url}-${index}`;
      case "open-tab":
        return `tab-${s.spaceId}-${s.tabId}-${index}`;
      case "pedal":
        return `pedal-${s.action}-${index}`;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden",
        "w-[calc(100vw-4px)] h-[calc(100vh-4px)]",
        "bg-[#202020]/90 backdrop-blur-lg",
        "select-none",
        "border-[#4D4D4D] border-2 m-[2px] rounded-[13px]"
      )}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-white/8 px-4 py-3.5">
        <Search className="size-3.5 shrink-0 text-zinc-100" strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => getOmniboxSuggestions(inputValue, flushSuggestions)}
          placeholder="Search or Enter URL..."
          className={cn(
            "min-w-0 flex-1 bg-transparent font-sans text-lg font-medium",
            "text-zinc-100 placeholder:text-zinc-500",
            "outline-none caret-[#3B82F6]"
          )}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          aria-autocomplete="list"
          aria-controls="omnibox-suggestions"
          aria-activedescendant={suggestions.length > 0 ? `omnibox-option-${selectedIndex}` : undefined}
        />
      </div>

      <div
        ref={listRef}
        id="omnibox-suggestions"
        role="listbox"
        className="min-h-0 flex-1 overflow-y-auto px-2 py-2 no-scrollbar"
      >
        {suggestions.map((suggestion, index) => (
          <OmniboxSuggestionRow
            key={suggestionKey(suggestion, index)}
            suggestion={suggestion}
            index={index}
            selected={index === selectedIndex}
            onSelect={commitSelected}
          />
        ))}
      </div>
    </div>
  );
}
