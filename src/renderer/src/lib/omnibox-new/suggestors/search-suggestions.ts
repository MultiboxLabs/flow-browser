import { generateTitleFromUrl, type OmniboxFlush } from "../helpers";
import { getSearchProvider } from "../search-providers";
import { mergeSearchCompletions, resolveCompletionUrl } from "../search-providers/helpers";
import type { SearchProviderCompletion } from "../search-providers/types";
import type { OmniboxSuggestion } from "../types";

const SEARCH_SUGGESTION_LIMIT = 5;

function sortSuggestions(suggestions: OmniboxSuggestion[]): OmniboxSuggestion[] {
  return [...suggestions].sort((left, right) => right.relevance - left.relevance);
}

function isNonNullable<T>(value: T | null): value is T {
  return value !== null;
}

function mapCompletionToSuggestion(completion: SearchProviderCompletion): OmniboxSuggestion | null {
  const searchProvider = getSearchProvider();
  const targetUrl = resolveCompletionUrl(searchProvider, completion);

  if (!targetUrl) {
    return null;
  }

  if (completion.kind === "navigation") {
    return {
      type: "website",
      title: completion.title ?? generateTitleFromUrl(targetUrl),
      url: targetUrl,
      description: completion.description ?? targetUrl,
      relevance: completion.relevance
    };
  }

  if (!completion.query) {
    return null;
  }

  return {
    type: "search",
    query: completion.query,
    url: targetUrl,
    relevance: completion.relevance
  };
}

function mergeOmniboxSuggestions(
  baseSuggestions: OmniboxSuggestion[],
  searchSuggestions: OmniboxSuggestion[]
): OmniboxSuggestion[] {
  const mergedSuggestions = [...baseSuggestions];

  for (const suggestion of searchSuggestions) {
    const alreadyPresent = mergedSuggestions.some((existing) => {
      if (existing.type === "search" && suggestion.type === "search") {
        return existing.url === suggestion.url;
      }

      if (existing.type === "website" && suggestion.type === "website") {
        return existing.url === suggestion.url;
      }

      return false;
    });

    if (!alreadyPresent) {
      mergedSuggestions.push(suggestion);
    }
  }

  return sortSuggestions(mergedSuggestions);
}

export function flushSearchSuggestions(
  input: string,
  verbatimSuggestions: OmniboxSuggestion[],
  flush: OmniboxFlush
): void {
  const searchProvider = getSearchProvider();
  if (!searchProvider.getSuggestions) {
    return;
  }

  const controller = new AbortController();

  void searchProvider
    .getSuggestions({
      input,
      limit: SEARCH_SUGGESTION_LIMIT,
      signal: controller.signal
    })
    .then((suggestions) => {
      const mergedCompletions = mergeSearchCompletions(suggestions.filter(isNonNullable), SEARCH_SUGGESTION_LIMIT);

      const searchSuggestions = mergedCompletions.map(mapCompletionToSuggestion).filter(isNonNullable);
      flush(mergeOmniboxSuggestions(verbatimSuggestions, searchSuggestions));
    })
    .catch((error: unknown) => {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("flushSearchSuggestions: search suggestions failed", error);
    });
}
