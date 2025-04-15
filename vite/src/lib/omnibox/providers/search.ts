import { BaseProvider } from "@/lib/omnibox/base-provider";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput, AutocompleteMatch } from "@/lib/omnibox/types";
import { createSearchUrl, getSearchSuggestions } from "@/lib/search";
import { getURLFromInput } from "@/lib/url";
import { getStringSimilarity } from "@/lib/omnibox/data-providers/string-similarity";

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
      // Don't fetch suggestions for URLs or very short inputs sometimes
      onResults([]);
      return;
    }

    const url = getURLFromInput(inputText);

    // Add the verbatim search immediately
    const verbatimMatch: AutocompleteMatch = {
      providerName: this.name,
      relevance: url ? 1250 : 1300, // High score to appear near top, but below strong nav
      contents: inputText,
      description: `Search for "${inputText}"`, // Or search engine name
      destinationUrl: createSearchUrl(inputText),
      type: "verbatim", // Special type for clarity, often treated as search
      isDefault: true // Usually the fallback default action
    };
    onResults([verbatimMatch], true); // Send verbatim immediately

    // Fetch remote suggestions asynchronously
    this.abortController = new AbortController();
    const abortSignal = this.abortController.signal;

    this.fetchSuggestions(inputText, abortSignal)
      .then((suggestions) => {
        if (abortSignal.aborted) return;

        const results: AutocompleteMatch[] = [];
        suggestions.forEach((suggestion, index) => {
          // Base relevance around 600-800, first suggestion is usually highest
          const baseRelevance = 800 - index * 50;
          // Calculate similarity with original input
          const similarity = getStringSimilarity(inputText, suggestion);
          // Boost relevance based on similarity, cap suggestions below verbatim/history
          const relevance = Math.min(1000, Math.ceil(baseRelevance + similarity * 200));

          // Check if suggestion looks like a URL (navigational suggestion)
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
