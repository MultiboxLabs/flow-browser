import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AutocompleteMatch } from "@/lib/omnibox/types";
import { Omnibox } from "@/lib/omnibox/omnibox";
import { useEffect, useRef, useState } from "react";
import { Search, History, Zap, Terminal, Settings, PlusSquare, ArrowRight, Link } from "lucide-react";
import { WebsiteFavicon } from "@/components/main/website-favicon";

function getIconForType(type: AutocompleteMatch["type"], match: AutocompleteMatch) {
  switch (type) {
    case "search-query":
    case "verbatim":
      return <Search className="h-5 w-5 text-black/80 dark:text-white/80" />;
    case "history-url":
      return <History className="h-5 w-5 text-black/80 dark:text-white/80" />;
    case "url-what-you-typed":
      return <WebsiteFavicon url={match.destinationUrl} className="h-5 w-5 text-black/80 dark:text-white/80" />;
    case "pedal":
      if (match.destinationUrl === "open_settings") {
        return <Settings className="h-5 w-5 text-black/80 dark:text-white/80" />;
      }
      if (match.destinationUrl === "open_new_window") {
        return <PlusSquare className="h-5 w-5 text-black/80 dark:text-white/80" />;
      }
      return <Zap className="h-5 w-5 text-black/80 dark:text-white/80" />;
    case "open-tab":
      return <Terminal className="h-5 w-5 text-black/80 dark:text-white/80" />;
    case "zero-suggest":
    default:
      return <Link className="h-5 w-5 text-black/80 dark:text-white/80" />;
  }
}

function getActionForType(type: AutocompleteMatch["type"]) {
  switch (type) {
    case "search-query":
    case "verbatim":
      return "Search";
    case "open-tab":
      return "Switch to Tab";
    case "history-url":
    case "url-what-you-typed":
    case "pedal":
    case "zero-suggest":
    default:
      return "Navigate";
  }
}

export function OmniboxMain() {
  const params = new URLSearchParams(window.location.search);
  const currentInput = params.get("currentInput");
  const openIn: "current" | "new_tab" = params.get("openIn") === "current" ? "current" : "new_tab";

  const [input, setInput] = useState(currentInput || "");
  const [matches, setMatches] = useState<AutocompleteMatch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const omniboxRef = useRef<Omnibox | null>(null);

  const [selectedValue, setSelectedValue] = useState("");

  // Initialize omnibox
  useEffect(() => {
    const handleSuggestionsUpdate = (updatedMatches: AutocompleteMatch[]) => {
      console.log("Received Updated Suggestions:", updatedMatches.length);
      setMatches(updatedMatches);
    };
    omniboxRef.current = new Omnibox(handleSuggestionsUpdate, {
      hasZeroSuggest: true,
      hasPedals: true
    });

    if (omniboxRef.current) {
      omniboxRef.current.handleInput(input, "focus");
    }

    return () => {
      omniboxRef.current?.stopQuery();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the selected value is not in the matches, set it to the first match
  useEffect(() => {
    const match = matches.find((match) => match.destinationUrl === selectedValue);
    if (!match && matches.length > 0) {
      setSelectedValue(matches[0].destinationUrl);
    }
  }, [selectedValue, matches]);

  // Focus on omnibox input
  useEffect(() => {
    inputRef.current?.focus();
    setTimeout(() => {
      inputRef.current?.select();
    }, 10);
  }, []);

  // Re-introduce handleOpenMatch adapting logic from omnibox.ts
  const handleOpenMatch = (match: AutocompleteMatch, whereToOpen: "current" | "new_tab") => {
    omniboxRef.current?.openMatch(match, whereToOpen);
    flow.omnibox.hide();
  };

  // Esc to close omnibox, Enter to navigate/search
  useEffect(() => {
    const inputBox = inputRef.current;
    if (!inputBox) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        flow.omnibox.hide();
        event.preventDefault();
      } else if (event.key === "Enter" && matches.length === 0 && input.trim() !== "") {
        // Use handleOpenMatch for verbatim input
        event.preventDefault();
        const verbatimMatch: AutocompleteMatch = {
          providerName: "Verbatim",
          type: "verbatim",
          contents: input,
          destinationUrl: input, // Assume input is URL or search query
          relevance: 9999,
          isDefault: false
        };
        handleOpenMatch(verbatimMatch, openIn);
      }
    };
    inputBox.addEventListener("keydown", handleKeyDown);
    return () => inputBox.removeEventListener("keydown", handleKeyDown);
  }, [input, matches.length, openIn]); // Added handleOpenMatch dependency implicitly via openIn

  const handleInputChange = (value: string) => {
    setInput(value);
    omniboxRef.current?.handleInput(value, "keystroke");
  };

  // Use the handleOpenMatch helper
  const handleSelect = (match: AutocompleteMatch) => {
    handleOpenMatch(match, openIn);
  };

  const handleFocus = () => {
    setTimeout(() => {
      inputRef.current?.setSelectionRange(0, inputRef.current?.value.length);
    }, 10);
  };

  const handleBlur = () => {
    inputRef.current?.setSelectionRange(0, 0);
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full h-full">
        <Command
          className="rounded-xl border-[1px] box-border border-[#e0e0e0] dark:border-[#504F4F] bg-white/90 dark:bg-black/90 backdrop-blur-xl overflow-hidden px-2 h-screen"
          loop
          value={selectedValue}
          onValueChange={setSelectedValue}
          shouldFilter={false}
          vimBindings={false}
          onBlur={() => {
            inputRef.current?.focus();
          }}
          disablePointerSelection
        >
          <div className="flex items-center py-2 border-b border-black/15 dark:border-white/15 *:size-full *:border-0">
            <CommandInput
              placeholder="Search or Enter URL..."
              value={input}
              onValueChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              ref={inputRef}
              className="text-lg font-medium placeholder:font-bold text-black/90 dark:text-white/90 placeholder:text-black/40 dark:placeholder:text-white/40"
              searchIconClassName="text-black dark:text-white opacity-100 size-4 mr-1"
            />
          </div>
          <CommandList
            className="pb-2 flex flex-col"
            style={{
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            }}
          >
            {matches.map((match) => (
              <CommandItem
                className="flex items-center justify-between my-1 px-4 py-3 cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 aria-selected:bg-black/15 dark:aria-selected:bg-white/15"
                key={match.destinationUrl}
                value={match.destinationUrl}
                onSelect={() => handleSelect(match)}
              >
                <div className="flex items-center min-w-0 flex-1 mr-3">
                  <div className="w-7 h-7 mr-1 flex-shrink-0 flex items-center justify-center">
                    {getIconForType(match.type, match)}
                  </div>
                  <span className="text-black/90 dark:text-white/90 truncate">{match.contents}</span>
                </div>
                <div className="flex items-center text-black/60 dark:text-white/60 flex-shrink-0">
                  <span className="mr-2">{getActionForType(match.type)}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
