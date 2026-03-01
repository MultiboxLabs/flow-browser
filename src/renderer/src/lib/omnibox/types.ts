/** Input classification result */
export enum InputType {
  URL = "url", // Clearly a URL (has protocol, dots+TLD, etc.)
  QUERY = "query", // Clearly a search query (multiple words, question)
  UNKNOWN = "unknown", // Ambiguous (single word, could be either)
  FORCED_QUERY = "forced_query", // User prefixed with '?' to force search
  KEYWORD = "keyword" // Matches a keyword/shortcut trigger
}

/** Why the query is being run */
export type InputTrigger = "focus" | "keystroke" | "paste";

/** Represents the input state for an autocomplete query. */
export interface AutocompleteInput {
  text: string; // The text entered by the user
  currentURL?: string; // The URL of the current page (context)
  trigger: InputTrigger; // Why the query is being run
  inputType: InputType; // Classification result
  preventInlineAutocomplete: boolean; // Explicit flag
  terms: string[]; // Pre-tokenized input terms
}

/** Match types - expanded */
export type MatchType =
  | "history-url"
  | "zero-suggest"
  | "verbatim"
  | "url-what-you-typed"
  | "search-query"
  | "search-history"
  | "navsuggest"
  | "open-tab"
  | "pedal"
  | "bookmark"
  | "shortcut";

/** Represents a single autocomplete suggestion. */
export interface AutocompleteMatch {
  providerName: string; // Name of the provider that generated this match
  relevance: number; // Score indicating importance (higher is better)
  contents: string; // Text displayed in the main line of the suggestion
  description?: string; // Text displayed in the second line (optional)
  destinationUrl: string; // The URL to navigate to or the search query URL
  type: MatchType; // The type of match
  isDefault?: boolean; // Hint if this could be the default action on Enter
  inlineCompletion?: string; // Text suggested for inline completion in the omnibox

  // Scoring metadata
  scoringSignals?: ScoringSignals;
  // Dedup key (normalized URL)
  dedupKey?: string;
  // Is this match allowed to be the default?
  allowedToBeDefault?: boolean;
}

/** Scoring signals for combined relevance computation */
export interface ScoringSignals {
  // Behavioral signals
  typedCount: number;
  visitCount: number;
  elapsedTimeSinceLastVisit: number; // ms
  frecency: number;

  // Match quality signals
  matchQualityScore: number; // 0..1 combined match quality
  hostMatchAtWordBoundary: boolean;
  hasNonSchemeWwwMatch: boolean;

  // Context signals
  isHostOnly: boolean;
  isBookmarked: boolean;
  hasOpenTabMatch: boolean;
  urlLength: number;

  // Provider-specific
  searchSuggestRelevance?: number;
  isVerbatim?: boolean;
  isNavSuggest?: boolean;
}
