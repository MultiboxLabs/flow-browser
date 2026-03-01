import { AutocompleteController } from "@/lib/omnibox/autocomplete-controller";
import { AutocompleteProvider } from "@/lib/omnibox/base-provider";
import { SearchProvider } from "@/lib/omnibox/providers/search";
import { HistoryURLProvider } from "@/lib/omnibox/providers/history-url";
import { HistoryQuickProvider } from "@/lib/omnibox/providers/history-quick";
import { ShortcutsProvider } from "@/lib/omnibox/providers/shortcut";
import { BookmarkProvider } from "@/lib/omnibox/providers/bookmark";
import { AutocompleteInput, AutocompleteMatch, InlineCompletion, InputType, InputTrigger } from "@/lib/omnibox/types";
import { ZeroSuggestProvider } from "@/lib/omnibox/providers/zero-suggest";
import { OpenTabProvider } from "@/lib/omnibox/providers/open-tab";
import { OmniboxPedalProvider } from "@/lib/omnibox/providers/pedal";
import { InMemoryURLIndex } from "@/lib/omnibox/in-memory-url-index";
import { tokenizeInput } from "@/lib/omnibox/tokenizer";
import { recordShortcutUsage } from "@/lib/omnibox/data-providers/shortcuts";

/** Callback for match updates (results list). */
export type OmniboxMatchCallback = (results: AutocompleteMatch[], continuous?: boolean) => void;

/** Callback for inline completion updates. */
export type OmniboxInlineCallback = (completion: InlineCompletion | null) => void;

/**
 * Combined callback — the internal plumbing uses this so the controller
 * only has a single onUpdate point.  The Omnibox class bridges the two
 * separate external callbacks into one.
 */
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

  /** The shared IMUI instance — populated on construction. */
  private imui: InMemoryURLIndex;

  /** External callback for inline completion updates. */
  private onInlineCompletion: OmniboxInlineCallback | null = null;

  constructor(
    onUpdate: OmniboxMatchCallback,
    options?: OmniboxCreateOptions & { onInlineCompletion?: OmniboxInlineCallback }
  ) {
    // Create the shared IMUI
    this.imui = new InMemoryURLIndex();

    // Store the inline completion callback
    this.onInlineCompletion = options?.onInlineCompletion ?? null;

    // Bridge: when controller updates, also compute and emit inline completion
    const wrappedOnUpdate: OmniboxUpdateCallback = (results, continuous) => {
      onUpdate(results, continuous);

      // Compute inline completion from the top match that has one
      if (this.onInlineCompletion) {
        const inlineCandidate = this.computeBestInlineCompletion(results);
        this.onInlineCompletion(inlineCandidate);
      }
    };

    // Instantiate providers
    const providers: AutocompleteProvider[] = [
      new HistoryQuickProvider(this.imui), // Sync, uses IMUI — must come first
      new BookmarkProvider(), // Sync stub — returns empty for now (Phase 4 TODO)
      new ShortcutsProvider(), // Async but fast — learned input→destination mappings
      new SearchProvider(), // Includes verbatim search + network suggestions
      new HistoryURLProvider(), // Includes history + URL suggestions (async DB fallback)
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

    this.controller = new AutocompleteController(providers, wrappedOnUpdate);

    // Populate the IMUI asynchronously on construction
    this.imui.populate();
  }

  /**
   * Compute the best inline completion from the current set of matches.
   * Per design doc section 7.1:
   *   - Only from sync providers (HQP, BookmarkProvider, ShortcutsProvider)
   *   - Prefix match required
   *   - Only high-confidence matches (relevance > 1200)
   *   - Only search-query/pedal types are excluded
   */
  private computeBestInlineCompletion(matches: AutocompleteMatch[]): InlineCompletion | null {
    // The current input must not prevent inline autocomplete
    const currentInput = this.controller.currentInput;
    if (!currentInput || currentInput.preventInlineAutocomplete) return null;
    if (currentInput.text.length < 2) return null;

    for (const match of matches) {
      if (!match.inlineCompletion) continue;
      if (match.relevance < 1200) continue;
      if (match.type === "search-query" || match.type === "pedal" || match.type === "verbatim") continue;

      return {
        fullUrl: match.destinationUrl,
        completionText: match.inlineCompletion,
        relevance: match.relevance
      };
    }

    return null;
  }

  /**
   * Call this when the user types in the Omnibox or focuses it.
   * @param text The current text in the Omnibox input field.
   * @param trigger Indicates why this query is being run (focus, keystroke, paste).
   */
  public handleInput(text: string, trigger: InputTrigger): void {
    // On focus, try to refresh the IMUI if stale
    if (trigger === "focus") {
      this.imui.populate(); // Throttled internally
    }

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

  /** Force a refresh of the IMUI (e.g., after many navigations). */
  public async refreshIndex(): Promise<void> {
    await this.imui.forceRefresh();
  }

  public openMatch(autocompleteMatch: AutocompleteMatch, whereToOpen: "current" | "new_tab"): void {
    // Record the shortcut (input→destination mapping) for future suggestions.
    // This is how the ShortcutsProvider learns user habits.
    // Only record for non-pedal, non-open-tab matches with meaningful input.
    const inputText = this.lastInputText.trim();
    if (
      inputText.length > 0 &&
      autocompleteMatch.type !== "pedal" &&
      autocompleteMatch.type !== "open-tab" &&
      autocompleteMatch.type !== "zero-suggest"
    ) {
      recordShortcutUsage(
        inputText,
        autocompleteMatch.destinationUrl,
        autocompleteMatch.description || autocompleteMatch.contents,
        autocompleteMatch.type
      );
    }

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
