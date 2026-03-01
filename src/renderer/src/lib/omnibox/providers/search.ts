import { BaseProvider } from "@/lib/omnibox/base-provider";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput, AutocompleteMatch, InputType } from "@/lib/omnibox/types";
import { createSearchUrl, getSearchSuggestions } from "@/lib/search";
import { tokenize, allTermsMatch, findBestMatch } from "@/lib/omnibox/tokenizer";

export class SearchProvider extends BaseProvider {
  name = "SearchProvider";
  private abortController: AbortController | null = null;

  // Fetching suggestions from selected search engine
  private async fetchSuggestions(query: string, signal?: AbortSignal): Promise<string[]> {
    const suggestions = await getSearchSuggestions(query, signal);
    return suggestions;
  }

  start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    const inputText = input.text;

    if (!inputText) {
      onResults([]);
      return;
    }

    // Verbatim search relevance depends on input classification:
    // - URL input: low (user clearly wants to navigate, not search)
    // - Forced query: high (user explicitly wants search via '?' prefix)
    // - Query/Unknown: high (search-first for text and ambiguous input)
    let verbatimRelevance: number;
    switch (input.inputType) {
      case InputType.URL:
        verbatimRelevance = 1100; // Below what-you-typed URL (1200)
        break;
      case InputType.FORCED_QUERY:
        verbatimRelevance = 1350; // User explicitly wants search
        break;
      case InputType.QUERY:
        verbatimRelevance = 1300; // Clearly a search query
        break;
      case InputType.UNKNOWN:
      default:
        verbatimRelevance = 1300; // Search-first for ambiguous input
        break;
    }

    // Add the verbatim search immediately
    const verbatimMatch: AutocompleteMatch = {
      providerName: this.name,
      relevance: verbatimRelevance,
      contents: inputText,
      description: `Search for "${inputText}"`,
      destinationUrl: createSearchUrl(inputText),
      type: "verbatim",
      isDefault: input.inputType !== InputType.URL // Not default when input is a URL
    };
    onResults([verbatimMatch], true); // Send verbatim immediately

    // Fetch remote suggestions asynchronously
    this.abortController = new AbortController();
    const abortSignal = this.abortController.signal;

    this.fetchSuggestions(inputText, abortSignal)
      .then((suggestions) => {
        if (abortSignal.aborted) return;

        const inputTerms = input.terms;
        const results: AutocompleteMatch[] = [];

        suggestions.forEach((suggestion, index) => {
          // Base relevance around 600-800, first suggestion is usually highest
          const baseRelevance = 800 - index * 50;

          // Calculate match quality using tokenized matching
          let matchBoost = 0;
          if (inputTerms.length > 0) {
            const suggestionTokens = tokenize(suggestion);
            if (allTermsMatch(inputTerms, suggestionTokens)) {
              // Good match — compute quality
              let matchScore = 0;
              for (const term of inputTerms) {
                const best = findBestMatch(term, suggestionTokens);
                if (best === "exact") matchScore += 1.0;
                else if (best === "prefix") matchScore += 0.7;
                else if (best === "substring") matchScore += 0.4;
              }
              matchBoost = (matchScore / inputTerms.length) * 200;
            } else {
              // Partial or no match — still include (server suggestion may be relevant)
              matchBoost = 50;
            }
          }

          // Cap suggestions below verbatim/history
          const relevance = Math.min(1000, Math.ceil(baseRelevance + matchBoost));

          const type: AutocompleteMatch["type"] = "search-query";
          const destinationUrl = createSearchUrl(suggestion);

          results.push({
            providerName: this.name,
            relevance: relevance,
            contents: suggestion,
            destinationUrl: destinationUrl,
            type: type
          });
        });
        onResults(results); // Send network results when they arrive
      })
      .catch((error) => {
        if (abortSignal.aborted) return;

        console.error("Search Suggestion Error:", error);
        onResults([]); // Send empty results on error
      });
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
