import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { AutocompleteMatch } from "@/lib/omnibox/types";
import { Omnibox } from "@/lib/omnibox/omnibox";
import { useEffect, useRef, useState } from "react";
import { Search, History, Zap, Terminal, Settings, PlusSquare, Link, PuzzleIcon } from "lucide-react";
import { WebsiteFavicon } from "@/components/main/website-favicon";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { CommandInput } from "cmdk";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/main/theme";

const SHOW_INSTRUCTIONS = true;

function getIconForType(type: AutocompleteMatch["type"], match: AutocompleteMatch) {
  switch (type) {
    case "search-query":
    case "verbatim":
      return <Search className="h-5 w-5 text-primary" />;
    case "history-url":
      return <History className="h-5 w-5 text-amber-500" />;
    case "url-what-you-typed":
      return <WebsiteFavicon url={match.destinationUrl} className="h-5 w-5" />;
    case "pedal":
      if (match.destinationUrl === "open_settings") {
        return <Settings className="h-5 w-5 text-blue-500" />;
      }
      if (match.destinationUrl === "open_new_window") {
        return <PlusSquare className="h-5 w-5 text-green-500" />;
      }
      if (match.destinationUrl === "open_extensions") {
        return <PuzzleIcon className="h-5 w-5 text-purple-500" />;
      }
      return <Zap className="h-5 w-5 text-purple-500" />;
    case "open-tab":
      return <Terminal className="h-5 w-5 text-teal-500" />;
    case "zero-suggest":
    default:
      return <Link className="h-5 w-5 text-gray-500" />;
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
      return "History";
    case "url-what-you-typed":
      return "Go to";
    case "pedal":
      return "Action";
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
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedValue, setSelectedValue] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  const { appliedTheme: theme } = useTheme();

  // Track window height for responsive sizing
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    setIsOpen(false);
    setTimeout(() => {
      omniboxRef.current?.openMatch(match, whereToOpen);
      flow.omnibox.hide();
    }, 150);
  };

  // Esc to close omnibox, Enter to navigate/search
  useEffect(() => {
    const inputBox = inputRef.current;
    if (!inputBox) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setTimeout(() => {
          flow.omnibox.hide();
        }, 150);
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

  // Calculate max height based on window size, accounting for padding and other elements
  const calculateMaxListHeight = () => {
    const inputHeight = 44; // p-3.5 + text-lg + padding
    const instructionsHeight = SHOW_INSTRUCTIONS ? 41 : 0; // Instructions bar height
    const padding = 0; // Additional padding for container

    // Subtract all the fixed elements from window height
    return `calc(${windowHeight}px - ${inputHeight + instructionsHeight + padding}px)`;
  };

  return (
    <div
      className="flex flex-col justify-start items-center min-h-screen max-h-screen w-full overflow-hidden"
      ref={containerRef}
    >
      <motion.div
        className="w-full h-full mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        style={{ maxHeight: "100vh" }}
      >
        <Command
          className={cn(
            "rounded-xl border backdrop-blur-xl overflow-hidden",
            "border-[#e0e0e0] dark:border-[#383838]",
            "bg-white/80 dark:bg-[#1c1c1c]/80",
            "transition-all duration-150",
            "flex flex-col",
            matches.length > 0 ? "h-screen" : "max-h-screen"
          )}
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
          <div className="flex items-center p-3.5 border-b border-black/10 dark:border-white/10 flex-shrink-0">
            <CommandInput
              placeholder="Search, navigate, or enter URL..."
              value={input}
              onValueChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              ref={inputRef}
              className="size-full outline-none text-lg font-medium placeholder:text-black/40 dark:placeholder:text-white/40"
            />
          </div>

          {matches.length > 0 && (
            <CommandList
              className="flex-1 px-1.5 py-2 overflow-y-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: theme === "dark" ? "rgba(255,255,255,0.2) transparent" : "rgba(0,0,0,0.2) transparent",
                maxHeight: calculateMaxListHeight()
              }}
            >
              <AnimatePresence>
                {matches.length === 0 && input && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 py-6 text-center text-black/50 dark:text-white/50"
                  >
                    {`No results found. Press Enter to search or navigate to "${input}".`}
                  </motion.div>
                )}

                {matches.map((match) => (
                  <CommandItem
                    className={cn(
                      "flex items-center justify-between my-0.5 px-3 py-2 cursor-pointer rounded-lg transition-colors",
                      "hover:bg-black/5 dark:hover:bg-white/10",
                      "aria-selected:!bg-black/10 dark:aria-selected:!bg-white/15"
                    )}
                    key={match.destinationUrl}
                    value={match.destinationUrl}
                    onSelect={() => handleSelect(match)}
                  >
                    <div className="flex items-center min-w-0 flex-1 mr-3">
                      <div className="w-8 h-8 mr-2 flex-shrink-0 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                        {getIconForType(match.type, match)}
                      </div>
                      <div className="max-w-[70%] overflow-hidden">
                        <span
                          className="text-black/90 dark:text-white/90 truncate block font-medium"
                          style={{ maxWidth: "100%" }}
                        >
                          {match.contents}
                        </span>
                        {match.type === "history-url" && (
                          <span
                            className="text-xs text-black/50 dark:text-white/50 truncate block"
                            style={{ maxWidth: "100%" }}
                          >
                            {match.destinationUrl}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-black/60 dark:text-white/60 flex-shrink-0 bg-black/5 dark:bg-white/10 rounded-md px-2 py-1">
                      <span>{getActionForType(match.type)}</span>
                    </div>
                  </CommandItem>
                ))}
              </AnimatePresence>
            </CommandList>
          )}

          {input && SHOW_INSTRUCTIONS && (
            <div className="px-3 py-2 text-xs text-black/50 dark:text-white/50 border-t border-black/10 dark:border-white/10 flex-shrink-0">
              <div className="flex justify-between">
                <div>
                  Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">↑</kbd>{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">↓</kbd> to navigate
                </div>
                <div>
                  Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">Enter</kbd> to select
                </div>
                <div>
                  Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">Esc</kbd> to close
                </div>
              </div>
            </div>
          )}
        </Command>
      </motion.div>
    </div>
  );
}
