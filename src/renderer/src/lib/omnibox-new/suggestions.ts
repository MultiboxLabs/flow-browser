import { getSearchProvider } from "./search-providers";
import type { SearchSuggestion } from "./types";

export function createSearchSuggestion(query: string, relevance: number, overrideUrl: string | null): SearchSuggestion {
  const searchProvider = getSearchProvider();
  const url = overrideUrl === null ? searchProvider.buildSearchUrl(query) : overrideUrl;
  return {
    type: "search",
    query,
    url,
    relevance
  };
}
