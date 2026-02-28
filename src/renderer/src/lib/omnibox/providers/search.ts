import { BaseProvider } from "@/lib/omnibox/base-provider";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput, AutocompleteMatch } from "@/lib/omnibox/types";
import { createSearchUrl, getSearchSuggestions } from "@/lib/search";
import { getURLFromInput } from "@/lib/url";
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

    const url = getURLFromInput(inputText);

    // Add the verbatim search immediately
    const verbatimMatch: AutocompleteMatch = {
      providerName: this.name,
      relevance: url ? 1250 : 1300, // High score to appear near top, but below strong nav
      contents: inputText,
      description: `Search for "${inputText}"`,
      destinationUrl: createSearchUrl(inputText),
      type: "verbatim",
      isDefault: true
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
