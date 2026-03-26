import { generateTitleFromUrl, isValidUrl, type OmniboxFlush } from "./helpers";
import { flushSearchSuggestions } from "./search-suggestions";
import { getSearchProvider } from "./search/index";
import type { OmniboxSuggestion } from "./types";

export { guardOmniboxFlush, type OmniboxFlush } from "./helpers";

const HIGHEST_RELEVANCE = 999999;

function getVerbatimSuggestions(trimmedInput: string): OmniboxSuggestion[] {
  const verbatimSuggestions: OmniboxSuggestion[] = [];

  // Website suggestion (if input can be normalized to a navigable URL)
  const targetUrl = isValidUrl(trimmedInput);
  if (targetUrl) {
    verbatimSuggestions.push({
      type: "website",
      title: generateTitleFromUrl(targetUrl),
      url: targetUrl,
      description: targetUrl,
      relevance: HIGHEST_RELEVANCE
    });
  }

  // Search suggestion
  const searchProvider = getSearchProvider();
  const searchUrl = searchProvider.buildSearchUrl(trimmedInput);

  if (searchUrl) {
    verbatimSuggestions.push({
      type: "search",
      query: trimmedInput,
      url: searchUrl,
      relevance: HIGHEST_RELEVANCE - 1
    });
  }

  return verbatimSuggestions;
}

function sortSuggestions(suggestions: OmniboxSuggestion[]): OmniboxSuggestion[] {
  return [...suggestions].sort((left, right) => right.relevance - left.relevance);
}

/**
 * Produce omnibox rows for the current input. Call `flush` whenever the list changes
 * (once or multiple times for incremental updates).
 *
 * For async work, pass a `flush` wrapped with {@link guardOmniboxFlush} at the call
 * site so stale completions cannot overwrite a newer query.
 */
export function getOmniboxSuggestions(input: string, flush: OmniboxFlush): void {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    flush([]);
    return;
  }

  const verbatimSuggestions = getVerbatimSuggestions(trimmedInput);
  flush(sortSuggestions(verbatimSuggestions));

  flushSearchSuggestions(trimmedInput, verbatimSuggestions, flush);
}
