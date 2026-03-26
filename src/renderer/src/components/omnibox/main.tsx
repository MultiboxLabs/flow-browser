import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { getOmniboxSuggestions, guardOmniboxFlush } from "@/lib/omnibox-new";
import type { OmniboxSuggestion } from "@/lib/omnibox-new/types";
import { OmniboxSuggestionRow } from "@/components/omnibox/omnibox-suggestion";
import { cn } from "@/lib/utils";
import type { OmniboxOpenState } from "~/flow/interfaces/browser/omnibox";
import "@/css/border.css";

const DEFAULT_OPEN_STATE: OmniboxOpenState = {
  currentInput: "",
  openIn: "current",
  sequence: 0
};

function getSuggestionIdentity(suggestion: OmniboxSuggestion): string {
  switch (suggestion.type) {
    case "search":
      return `search:${suggestion.url}`;
    case "website":
      return `website:${suggestion.url}`;
    case "open-tab":
      return `open-tab:${suggestion.spaceId}:${suggestion.tabId}`;
    case "pedal":
      return `pedal:${suggestion.action}`;
  }
}

function sortSuggestions(items: OmniboxSuggestion[]): OmniboxSuggestion[] {
  return [...items].sort((left, right) => right.relevance - left.relevance);
}

function mergeSuggestions(existing: OmniboxSuggestion[], incoming: OmniboxSuggestion[]): OmniboxSuggestion[] {
  if (incoming.length === 0) {
    return existing;
  }

  const merged = new Map<string, OmniboxSuggestion>();

  for (const suggestion of existing) {
    merged.set(getSuggestionIdentity(suggestion), suggestion);
  }

  for (const suggestion of incoming) {
    merged.set(getSuggestionIdentity(suggestion), suggestion);
  }

  return sortSuggestions(Array.from(merged.values()));
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
      const url = suggestion.url;
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
  const [openState, setOpenState] = useState<OmniboxOpenState>(DEFAULT_OPEN_STATE);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<OmniboxSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const suggestionRequestIdRef = useRef(0);

  const ensureInputFocused = useCallback((selection: "preserve" | "end" | "all" = "preserve") => {
    const el = inputRef.current;
    if (!el) return;

    if (document.activeElement !== el) {
      el.focus();
    }

    if (selection === "end") {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    } else if (selection === "all") {
      el.setSelectionRange(0, el.value.length);
    }
  }, []);

  const applySuggestions = useCallback((items: OmniboxSuggestion[]) => {
    setSuggestions((currentSuggestions) => mergeSuggestions(currentSuggestions, items));
    setSelectedIndex(0);
  }, []);

  const requestSuggestions = useCallback(
    (input: string) => {
      const requestId = ++suggestionRequestIdRef.current;
      setSuggestions([]);
      setSelectedIndex(0);
      const flush = guardOmniboxFlush(requestId, () => suggestionRequestIdRef.current, applySuggestions);
      getOmniboxSuggestions(input, flush);
    },
    [applySuggestions]
  );

  useEffect(() => {
    requestSuggestions(inputValue);
  }, [inputValue, requestSuggestions]);

  useEffect(() => {
    let isMounted = true;
    void flow.omnibox.getState().then((state) => {
      if (!isMounted || !state) return;
      setOpenState(state);
    });

    const unsubscribe = flow.omnibox.onStateChanged((state) => {
      setOpenState(state);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleWindowFocus = () => {
      requestAnimationFrame(() => {
        ensureInputFocused();
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      requestAnimationFrame(() => {
        ensureInputFocused();
      });
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [ensureInputFocused]);

  useEffect(() => {
    setInputValue(openState.currentInput);
    setSelectedIndex(0);
    requestSuggestions(openState.currentInput);

    requestAnimationFrame(() => {
      ensureInputFocused(openState.currentInput ? "all" : "end");
    });
  }, [openState, requestSuggestions, ensureInputFocused]);

  const commitSelected = useCallback(
    (suggestion: OmniboxSuggestion) => {
      commitSuggestion(suggestion, openState.openIn);
    },
    [openState.openIn]
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
    <div className="border-[0.5px] border-(--frame-shadow-border) rounded-[13px]">
      <div className="border border-(--frame-highlight-border) rounded-[13px]">
        <div
          className={cn(
            "flex flex-col overflow-hidden",
            "w-[calc(100vw-3px)] h-[calc(100vh-3px)]",
            "bg-[#202020]/90 backdrop-blur-lg",
            "select-none",
            "rounded-[13px]"
          )}
          onMouseDownCapture={(e) => {
            if (e.target !== inputRef.current) {
              requestAnimationFrame(() => {
                ensureInputFocused();
              });
            }
          }}
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-white/8 px-4 py-3.5">
            <Search className="ml-1.5 size-3.5 shrink-0 text-zinc-100" strokeWidth={2} aria-hidden />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={onKeyDown}
              // onFocus={() => requestSuggestions(inputValue)}
              onBlur={() => {
                requestAnimationFrame(() => {
                  if (document.hasFocus()) {
                    ensureInputFocused();
                  }
                });
              }}
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
      </div>
    </div>
  );
}
