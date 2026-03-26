import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { requestOmniboxSuggestions } from "@/lib/omnibox-new";
import { primeQuickHistoryCache } from "@/lib/omnibox-new/suggestors";
import type { OmniboxSuggestion } from "@/lib/omnibox-new/types";
import { OmniboxSuggestionRow } from "@/components/omnibox/omnibox-suggestion";
import { useSetting } from "@/components/providers/settings-provider";
import { useSpaces } from "@/components/providers/spaces-provider";
import { cn } from "@/lib/utils";
import type { OmniboxOpenState } from "~/flow/interfaces/browser/omnibox";
import "@/css/border.css";
import { setOmniboxCurrentProfileId } from "@/lib/omnibox-new/states";

const DEFAULT_OPEN_STATE: OmniboxOpenState = {
  currentInput: "",
  openIn: "current",
  sequence: 0,
  shadowPadding: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
};

const OMNIBOX_SHADOW =
  "0 10px 25px -10px rgba(0, 0, 0, 0.52), 0 6px 14px -8px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.16), 0 1px 0 rgba(255, 255, 255, 0.08)";

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
  const { currentSpace } = useSpaces();
  const [openState, setOpenState] = useState<OmniboxOpenState>(DEFAULT_OPEN_STATE);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<OmniboxSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const suggestionRequestIdRef = useRef(0);
  const [commandPaletteOpacity] = useSetting<"solid" | "tinted" | "glassy">("commandPaletteOpacity");

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
    setSuggestions(items);
    setSelectedIndex(0);
  }, []);

  const requestSuggestions = useCallback(
    (input: string) => {
      const requestId = ++suggestionRequestIdRef.current;
      setSuggestions([]);
      setSelectedIndex(0);
      setOmniboxCurrentProfileId(currentSpace?.profileId);
      requestOmniboxSuggestions({
        input,
        requestId,
        getCurrentRequestId: () => suggestionRequestIdRef.current,
        applySuggestions
      });
    },
    [applySuggestions, currentSpace?.profileId]
  );

  useEffect(() => {
    requestSuggestions(inputValue);
  }, [inputValue, requestSuggestions]);

  useEffect(() => {
    void primeQuickHistoryCache(currentSpace?.profileId);
  }, [currentSpace?.profileId]);

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
    void primeQuickHistoryCache(currentSpace?.profileId, { force: true });
    requestSuggestions(openState.currentInput);

    requestAnimationFrame(() => {
      ensureInputFocused(openState.currentInput ? "all" : "end");
    });
  }, [currentSpace?.profileId, openState.sequence, openState.currentInput, requestSuggestions, ensureInputFocused]);

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
    <div
      className={"h-screen w-screen box-border"}
      style={{
        paddingTop: openState.shadowPadding.top,
        paddingRight: openState.shadowPadding.right,
        paddingBottom: openState.shadowPadding.bottom,
        paddingLeft: openState.shadowPadding.left
      }}
    >
      <div
        className={cn(
          "h-full w-full rounded-[13px]",
          "backdrop-blur-sm",
          commandPaletteOpacity === "solid" && "bg-[#202020]",
          commandPaletteOpacity === "tinted" && "bg-[#202020]/90",
          commandPaletteOpacity === "glassy" && "bg-[#202020]/70"
        )}
        style={{ boxShadow: OMNIBOX_SHADOW }}
      >
        <div className="h-full w-full border-[0.5px] border-(--frame-shadow-border) rounded-[13px]">
          <div className="h-full w-full border border-(--frame-highlight-border) rounded-[13px]">
            <div
              className={cn("flex h-full w-full flex-col overflow-hidden", "select-none", "rounded-[13px]")}
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
      </div>
    </div>
  );
}
