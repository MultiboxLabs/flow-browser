/** Represents the input state for an autocomplete query. */
export interface AutocompleteInput {
  text: string; // The text entered by the user
  currentURL?: string; // The URL of the current page (context)
  type: "focus" | "keystroke"; // Why the query is being run
  preventInlineAutocomplete?: boolean; // Hint to providers
}

/** Represents a single autocomplete suggestion. */
export interface AutocompleteMatch {
  providerName: string; // Name of the provider that generated this match
  relevance: number; // Score indicating importance (higher is better)
  contents: string; // Text displayed in the main line of the suggestion
  description?: string; // Text displayed in the second line (optional)
  destinationUrl: string; // The URL to navigate to or the search query URL
  type: "history-url" | "zero-suggest" | "verbatim" | "url-what-you-typed" | "search-query" | "open-tab" | "pedal";
  isDefault?: boolean; // Hint if this could be the default action on Enter
  inlineCompletion?: string; // Text suggested for inline completion in the omnibox
}
