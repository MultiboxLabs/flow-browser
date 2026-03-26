import { createSearchSuggestion, createWebsiteSuggestion } from "../suggestions";
import { type OmniboxFlush } from "../helpers";
import { getSearchProvider } from "../search-providers";
import { mergeSearchCompletions, resolveCompletionUrl } from "../search-providers/helpers";
import type { SearchProviderCompletion } from "../search-providers/types";
import type { OmniboxSuggestion } from "../types";

const SEARCH_SUGGESTION_LIMIT = 5;

function isNonNullable<T>(value: T | null): value is T {
  return value !== null;
}

function mapCompletionToSuggestion(completion: SearchProviderCompletion): OmniboxSuggestion | null {
  const targetUrl = resolveCompletionUrl(completion);

  if (completion.kind === "navigation") {
    if (!targetUrl) {
      return null;
    }
    return createWebsiteSuggestion(targetUrl, completion.relevance, completion.title, "search-provider");
  }

  if (!completion.query) {
    return null;
  }
  return createSearchSuggestion(completion.query, completion.relevance, null, "search-provider");
}

export function flushSearchSuggestions(input: string, flush: OmniboxFlush, signal: AbortSignal): void {
  const searchProvider = getSearchProvider();
  if (!searchProvider.getSuggestions || signal.aborted) {
    return;
  }

  void searchProvider
    .getSuggestions({
      input,
      limit: SEARCH_SUGGESTION_LIMIT,
      signal
    })
    .then((suggestions) => {
      const mergedCompletions = mergeSearchCompletions(suggestions.filter(isNonNullable), SEARCH_SUGGESTION_LIMIT);
      const searchSuggestions = mergedCompletions.map(mapCompletionToSuggestion).filter(isNonNullable);
      flush(searchSuggestions);
    })
    .catch((error: unknown) => {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("flushSearchSuggestions: search suggestions failed", error);
    });
}
