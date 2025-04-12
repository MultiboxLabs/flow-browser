"use client";

import { ArrowRight, GlobeIcon, SearchIcon } from "lucide-react";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useEffect, useRef, useState } from "react";
import { OmniboxMatch, handleOmniboxInput } from "@/lib/omnibox";

type OmniboxItemProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: string;
  showArrow?: boolean;
} & React.ComponentProps<typeof CommandItem>;

function OmniboxItem({ icon, label, value, action = "Switch to Tab", showArrow = true, ...props }: OmniboxItemProps) {
  return (
    <CommandItem className="flex items-center justify-between px-4 py-3 cursor-pointer" value={value} {...props}>
      <div className="flex items-center">
        <div className="w-7 h-7 mr-1 flex items-center justify-center">{icon}</div>
        <span className="text-black/80 dark:text-white/80">{label}</span>
      </div>
      {showArrow && (
        <div className="flex items-center text-black/50 dark:text-white/50">
          <span className="mr-2">{action}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      )}
    </CommandItem>
  );
}

function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        resolve(tabs[0]);
      } else {
        resolve(null);
      }
    });
  });
}

export function Omnibox() {
  const params = new URLSearchParams(window.location.search);
  const currentInput = params.get("currentInput");
  const openIn = params.get("openIn") || "new_tab";

  const [input, setInput] = useState(currentInput || "");
  const [matches, setMatches] = useState<OmniboxMatch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Esc to close omnibox
  useEffect(() => {
    const inputBox = inputRef.current;
    if (!inputBox) return;

    const handleEscape = (event: KeyboardEvent) => {
      console.log("handleEscape", event.key);
      if (event.key === "Escape") {
        flow.omnibox.hide();
        event.preventDefault();
      }
    };
    inputBox.addEventListener("keydown", handleEscape);
    return () => inputBox.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (input.trim() === "") {
      setMatches([]);
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const fetchMatches = async () => {
      try {
        const updateCallback = (matches: OmniboxMatch[]) => {
          setMatches(matches);
        };
        await handleOmniboxInput(input, abortControllerRef.current?.signal, updateCallback);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Request was aborted, do nothing
        } else {
          console.error("Error fetching omnibox matches:", error);
        }
      }
    };

    // Debounce the matches fetch
    const timeoutId = setTimeout(() => {
      fetchMatches();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [input]);

  const handleSelect = async (match: OmniboxMatch) => {
    let currentTab: chrome.tabs.Tab | null = null;

    if (openIn === "current") {
      const t = await getCurrentTab();
      if (t?.id) {
        currentTab = t;
      }
    }

    if (currentTab) {
      if (currentTab.url !== match.destinationUrl) {
        chrome.tabs.update(currentTab.id!, { url: match.destinationUrl });
      }
    } else {
      window.open(match.destinationUrl, "_blank");
    }

    flow.omnibox.hide();
  };

  // Get the appropriate icon for each match type
  const getMatchIcon = (match: OmniboxMatch) => {
    switch (match.type) {
      case "search":
        return <SearchIcon className="h-5 w-5 text-black/80 dark:text-white/80" />;
      case "history":
      case "bookmark":
      case "verbatim":
      case "navigation":
      case "tab":
      default:
        return <GlobeIcon className="h-5 w-5 text-black/80 dark:text-white/80" />;
    }
  };

  // Get appropriate action text for each match type
  const getMatchAction = (match: OmniboxMatch) => {
    switch (match.type) {
      case "search":
        return "Search";
      case "tab":
        return "Switch to Tab";
      case "history":
      case "bookmark":
      case "verbatim":
      case "navigation":
      default:
        return "Navigate";
    }
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
    <div className="flex justify-center items-start min-h-screen">
      <div className="w-full h-full">
        <Command
          className="rounded-xl border-[1px] box-border border-[#464648] bg-white dark:bg-black shadow-md overflow-hidden px-2 h-screen"
          loop
          vimBindings={false}
          shouldFilter={false}
          onBlur={() => {
            inputRef.current?.focus();
          }}
          disablePointerSelection
        >
          <div className="flex items-center py-1.5 border-b border-black/10 dark:border-white/10 *:size-full *:border-0">
            <CommandInput
              placeholder="Search or Enter URL"
              value={input}
              onValueChange={setInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
              ref={inputRef}
              className="text-sm"
            />
          </div>
          <CommandList
            className="py-2"
            style={{
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            }}
          >
            {matches.map((match, index) => (
              <OmniboxItem
                key={index}
                icon={getMatchIcon(match)}
                label={match.content}
                value={index.toString()}
                keywords={[match.content]}
                action={getMatchAction(match)}
                showArrow={true}
                onSelect={() => handleSelect(match)}
              />
            ))}
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
