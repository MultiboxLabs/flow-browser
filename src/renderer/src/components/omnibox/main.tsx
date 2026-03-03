import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { AutocompleteMatch, InlineCompletion } from "@/lib/omnibox/types";
import { Omnibox } from "@/lib/omnibox/omnibox";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Search,
  History,
  Zap,
  Terminal,
  Settings,
  PlusSquare,
  Link,
  PuzzleIcon,
  Globe,
  Bookmark,
  ArrowUpRight
} from "lucide-react";
import { WebsiteFavicon } from "@/components/main/website-favicon";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { CommandInput } from "cmdk";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/main/theme";
import { OmniboxShowParams } from "~/flow/interfaces/browser/omnibox";

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
    case "navsuggest":
      return <Globe className="h-5 w-5 text-blue-500" />;
    case "bookmark":
      return <Bookmark className="h-5 w-5 text-yellow-500" />;
    case "shortcut":
      return <ArrowUpRight className="h-5 w-5 text-violet-500" />;
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
      return <Terminal className="h-5 w-5 text-teal-600 dark:text-teal-500" />;
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
    case "navsuggest":
      return "Navigate";
    case "bookmark":
      return "Bookmark";
    case "shortcut":
      return "Shortcut";
    case "pedal":
      return "Action";
    case "zero-suggest":
    default:
      return "Navigate";
  }
}

export function OmniboxMain() {
  // --- State ---
  const [input, setInput] = useState("");
  const [matches, setMatches] = useState<AutocompleteMatch[]>([]);
  const [inlineCompletion, setInlineCompletion] = useState<InlineCompletion | null>(null);
  const [selectedValue, setSelectedValue] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  // Current openIn mode — updated on each show event
  const openInRef = useRef<"current" | "new_tab">("new_tab");

  const inputRef = useRef<HTMLInputElement>(null);
  const omniboxRef = useRef<Omnibox | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { appliedTheme: theme } = useTheme();

  // Track window height for responsive sizing
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Initialize Omnibox instance once (persistent) ---
  useEffect(() => {
    const handleSuggestionsUpdate = (updatedMatches: AutocompleteMatch[]) => {
      console.log("Received Updated Suggestions:", updatedMatches.length);
      setMatches(updatedMatches);
    };
    const handleInlineCompletion = (completion: InlineCompletion | null) => {
      setInlineCompletion(completion);
    };
    omniboxRef.current = new Omnibox(handleSuggestionsUpdate, {
      hasZeroSuggest: true,
      hasPedals: true,
      onInlineCompletion: handleInlineCompletion
    });

    return () => {
      omniboxRef.current?.stopQuery();
    };
  }, []);

  // --- Listen for IPC show/hide events from main process ---
  useEffect(() => {
    const cleanupShow = flow.omnibox.onShow((params: OmniboxShowParams) => {
      console.log("Omnibox: received show event", params);

      // Update openIn mode
      openInRef.current = params.openIn ?? "new_tab";

      // Reset state for the new show
      const initialInput = params.currentInput ?? "";
      setInput(initialInput);
      setMatches([]);
      setInlineCompletion(null);
      setSelectedValue("");
      setIsVisible(true);

      // Trigger the omnibox query (focus trigger for initial population)
      omniboxRef.current?.handleInput(initialInput, "focus");

      // Focus the input field
      setTimeout(() => {
        inputRef.current?.focus();
        if (initialInput) {
          inputRef.current?.select();
        }
      }, 10);
    });

    const cleanupHide = flow.omnibox.onHide(() => {
      console.log("Omnibox: received hide event");
      setIsVisible(false);
      omniboxRef.current?.stopQuery();
    });

    return () => {
      cleanupShow();
      cleanupHide();
    };
  }, []);

  // --- Handle initial URL params for the first load (backward compat) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentInput = params.get("currentInput");
    const openIn = params.get("openIn") === "current" ? "current" : "new_tab";

    if (currentInput !== null || params.has("openIn")) {
      // First load was triggered with URL params (before IPC was set up)
      openInRef.current = openIn as "current" | "new_tab";
      setInput(currentInput || "");
      setIsVisible(true);

      if (omniboxRef.current) {
        omniboxRef.current.handleInput(currentInput || "", "focus");
      }

      setTimeout(() => {
        inputRef.current?.focus();
        if (currentInput) {
          inputRef.current?.select();
        }
      }, 10);
    }
  }, []);

  // If the selected value is not in the matches, set it to the first match
  useEffect(() => {
    const match = matches.find((match) => match.destinationUrl === selectedValue);
    if (!match && matches.length > 0) {
      setSelectedValue(matches[0].destinationUrl);
    }
  }, [selectedValue, matches]);

  // Re-introduce handleOpenMatch adapting logic from omnibox.ts
  const handleOpenMatch = useCallback((match: AutocompleteMatch, whereToOpen: "current" | "new_tab") => {
    setIsVisible(false);
    setTimeout(() => {
      omniboxRef.current?.openMatch(match, whereToOpen);
      flow.omnibox.hide();
    }, 150);
  }, []);

  // Accept inline completion: sets input to the full URL and clears the ghost text
  const acceptInlineCompletion = useCallback(() => {
    if (inlineCompletion) {
      const newText = input + inlineCompletion.completionText;
      setInput(newText);
      setInlineCompletion(null);
      omniboxRef.current?.handleInput(newText, "keystroke");
    }
  }, [inlineCompletion, input]);

  // Esc to close omnibox, Enter to navigate/search, Tab/Right to accept inline completion,
  // Arrow keys to navigate results (with lock)
  useEffect(() => {
    const inputBox = inputRef.current;
    if (!inputBox) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsVisible(false);
        setTimeout(() => {
          flow.omnibox.hide();
        }, 150);
        event.preventDefault();
      } else if ((event.key === "Tab" || event.key === "ArrowRight") && inlineCompletion) {
        // Accept inline completion on Tab or Right Arrow (when at end of input)
        const atEnd = inputBox.selectionStart === inputBox.value.length;
        if (event.key === "Tab" || atEnd) {
          event.preventDefault();
          acceptInlineCompletion();
        }
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        // Notify the controller about arrow key navigation to suppress result updates
        omniboxRef.current?.onUserArrowKey();
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
        handleOpenMatch(verbatimMatch, openInRef.current);
      }
    };
    inputBox.addEventListener("keydown", handleKeyDown);
    return () => inputBox.removeEventListener("keydown", handleKeyDown);
  }, [input, matches.length, inlineCompletion, acceptInlineCompletion, handleOpenMatch]);

  const handleInputChange = (value: string) => {
    setInput(value);
    // Inline completion will be recalculated by the omnibox via callback
    omniboxRef.current?.handleInput(value, "keystroke");
  };

  // Use the handleOpenMatch helper
  const handleSelect = (match: AutocompleteMatch) => {
    handleOpenMatch(match, openInRef.current);
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
      className="flex flex-col justify-start items-center min-h-screen max-h-screen w-full overflow-hidden p-[1px]"
      ref={containerRef}
    >
      <div className="w-full h-full mx-auto" style={{ maxHeight: "100vh", opacity: isVisible ? 1 : 0 }}>
        <Command
          className={cn(
            "rounded-xl border backdrop-blur-xl overflow-hidden",
            "border-[#949494] dark:border-[#383838]",
            "bg-white/80 dark:bg-[#1c1c1c]/80",
            "transition-all duration-150",
            "flex flex-col",
            "h-[calc(100vh-2px)]",
            "shadow-[0_0_0_0.5px_transparent] dark:shadow-[0_0_0_0.5px_black]"
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
          <div className="flex items-center p-3.5 border-b border-black/10 dark:border-white/10 flex-shrink-0 relative">
            <div className="relative flex-1">
              <CommandInput
                placeholder="Search, navigate, or enter URL..."
                value={input}
                onValueChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                ref={inputRef}
                className="size-full outline-none text-lg font-medium placeholder:text-black/40 dark:placeholder:text-white/40"
              />
              {/* Inline completion ghost text overlay */}
              {inlineCompletion && input.length > 0 && (
                <div
                  className="absolute top-0 left-0 h-full flex items-center pointer-events-none text-lg font-medium"
                  aria-hidden="true"
                >
                  {/* Invisible text matching the input to position the ghost text */}
                  <span className="invisible whitespace-pre">{input}</span>
                  {/* Ghost text in muted color */}
                  <span className="text-black/30 dark:text-white/30 whitespace-pre">
                    {inlineCompletion.completionText}
                  </span>
                </div>
              )}
            </div>
          </div>

          {matches.length > 0 && (
            <CommandList
              className="flex-1 px-1.5 py-2 overflow-y-auto no-scrollbar"
              style={{
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
                        {(match.type === "history-url" ||
                          match.type === "navsuggest" ||
                          match.type === "bookmark" ||
                          match.type === "shortcut") &&
                          match.description && (
                            <span
                              className="text-xs text-black/50 dark:text-white/50 truncate block"
                              style={{ maxWidth: "100%" }}
                            >
                              {match.description}
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
      </div>
    </div>
  );
}
