import { AutocompleteController } from "@/lib/omnibox/autocomplete-controller";
import { AutocompleteProvider } from "@/lib/omnibox/base-provider";
import { SearchProvider } from "@/lib/omnibox/providers/search";
import { HistoryURLProvider } from "@/lib/omnibox/providers/history-url";
import { AutocompleteInput, AutocompleteMatch, InputType, InputTrigger } from "@/lib/omnibox/types";
import { ZeroSuggestProvider } from "@/lib/omnibox/providers/zero-suggest";
import { OpenTabProvider } from "@/lib/omnibox/providers/open-tab";
import { OmniboxPedalProvider } from "@/lib/omnibox/providers/pedal";
import { tokenizeInput } from "@/lib/omnibox/tokenizer";

/** Callback function type for notifying the UI/consumer about updated suggestions. */
export type OmniboxUpdateCallback = (results: AutocompleteMatch[], continuous?: boolean) => void;

export type OmniboxCreateOptions = {
  hasZeroSuggest?: boolean;
  hasPedals?: boolean;
};

/**
 * Basic input classifier (Phase 1).
 * Applies the classification rules from the design doc (section 5.2) in order.
 * A full InputClassifier class with keyword support is deferred to Phase 2.
 */
function classifyInput(text: string): InputType {
  const trimmed = text.trim();

  if (!trimmed) return InputType.UNKNOWN;

  // Rule 1: Forced search — starts with '?'
  if (trimmed.startsWith("?")) return InputType.FORCED_QUERY;

  // Rule 2: Has protocol — matches ^[a-zA-Z]+://
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return InputType.URL;

  // Rule 3: Has port — host:port pattern (e.g., localhost:3000)
  if (/^[a-zA-Z0-9.-]+:\d{1,5}(\/|$)/.test(trimmed)) return InputType.URL;

  // Rule 4: IP address — IPv4
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/|:\d+|$)/.test(trimmed)) return InputType.URL;

  // Rule 5: Trailing slash
  if (trimmed.endsWith("/") && !trimmed.includes(" ")) return InputType.URL;

  // Rule 6: Domain-like — word.tld where tld is known
  // Common TLDs for a quick check
  const COMMON_TLDS = new Set([
    "com",
    "org",
    "net",
    "edu",
    "gov",
    "io",
    "co",
    "dev",
    "app",
    "me",
    "info",
    "biz",
    "uk",
    "de",
    "fr",
    "jp",
    "au",
    "ca",
    "us",
    "ru",
    "cn",
    "in",
    "br",
    "it",
    "nl",
    "se",
    "no",
    "fi",
    "xyz",
    "ai",
    "ly",
    "tv",
    "cc"
  ]);

  // Match domain-like patterns: word.tld or sub.word.tld (no spaces)
  if (!trimmed.includes(" ")) {
    const domainMatch = trimmed.match(/^[a-zA-Z0-9.-]+\.([a-zA-Z]{2,})(?:[/?#].*)?$/);
    if (domainMatch && COMMON_TLDS.has(domainMatch[1].toLowerCase())) {
      return InputType.URL;
    }
  }

  // Rule 7: Keyword trigger — deferred to Phase 2

  // Rule 8: Multi-word — contains spaces (after trim)
  if (trimmed.includes(" ")) return InputType.QUERY;

  // Rule 9: Single word — everything else is ambiguous
  return InputType.UNKNOWN;
}

/**
 * Determine if inline autocomplete should be prevented.
 * Inline autocomplete is suppressed for pastes, deletions, and certain input types.
 */
function shouldPreventInlineAutocomplete(trigger: InputTrigger, inputType: InputType): boolean {
  // Prevent inline autocomplete on paste (user pasted content, not typing)
  if (trigger === "paste") return true;

  // Prevent for forced queries (user explicitly wants search)
  if (inputType === InputType.FORCED_QUERY) return true;

  // Prevent for multi-word queries (unlikely to want URL completion mid-query)
  if (inputType === InputType.QUERY) return true;

  return false;
}

export class Omnibox {
  private controller: AutocompleteController;
  private lastInputText: string = ""; // Track input to manage focus vs keystroke

  constructor(onUpdate: OmniboxUpdateCallback, options?: OmniboxCreateOptions) {
    // Instantiate providers based on the summary
    const providers: AutocompleteProvider[] = [
      new SearchProvider(), // Includes verbatim search + network suggestions
      new HistoryURLProvider(), // Includes history + URL suggestions
      new OpenTabProvider() // Includes open tabs
    ];

    // Includes zero-suggestions
    if (options?.hasZeroSuggest) {
      providers.push(new ZeroSuggestProvider());
    }

    // Includes pedals
    if (options?.hasPedals) {
      providers.push(new OmniboxPedalProvider());
    }

    this.controller = new AutocompleteController(providers, onUpdate);
  }

  /**
   * Call this when the user types in the Omnibox or focuses it.
   * @param text The current text in the Omnibox input field.
   * @param trigger Indicates why this query is being run (focus, keystroke, paste).
   */
  public handleInput(text: string, trigger: InputTrigger): void {
    const inputType = classifyInput(text);
    const terms = tokenizeInput(text);
    const preventInlineAutocomplete = shouldPreventInlineAutocomplete(trigger, inputType);

    const input: AutocompleteInput = {
      text: text,
      trigger: trigger,
      inputType: inputType,
      terms: terms,
      preventInlineAutocomplete: preventInlineAutocomplete
    };

    // Basic logic to differentiate initial focus from subsequent keystrokes
    if (trigger === "focus" && text === this.lastInputText) {
      // If focused and text hasn't changed (e.g., clicking back into the bar)
      // Re-trigger with 'focus' trigger, especially important for ZeroSuggest
      this.controller.start(input);
    } else if (text !== this.lastInputText || trigger === "focus") {
      // If text changed OR it's a focus event (even with same text initially)
      this.controller.start(input);
    }
    // Else: Keystroke didn't change text (e.g., arrow keys) - do nothing for now

    this.lastInputText = text;
  }

  /** Call this when the Omnibox is blurred or closed to clean up. */
  public stopQuery(): void {
    this.controller.stop();
    this.lastInputText = ""; // Reset last input on stop
  }

  public openMatch(autocompleteMatch: AutocompleteMatch, whereToOpen: "current" | "new_tab"): void {
    if (autocompleteMatch.type === "open-tab") {
      const [, tabId] = autocompleteMatch.destinationUrl.split(":");
      flow.tabs.switchToTab(parseInt(tabId));
    } else if (autocompleteMatch.type === "pedal") {
      const pedalAction = autocompleteMatch.destinationUrl;
      // Execute the pedal action
      if (pedalAction === "open_settings") {
        flow.windows.openSettingsWindow();
      } else if (pedalAction === "open_new_window") {
        flow.browser.createWindow();
      } else if (pedalAction === "open_extensions") {
        flow.tabs.newTab("flow://extensions", true);
      }
    } else {
      const url = autocompleteMatch.destinationUrl;
      if (whereToOpen === "current") {
        flow.navigation.goTo(url);
      } else {
        flow.tabs.newTab(url, true);
      }
    }
  }
}
