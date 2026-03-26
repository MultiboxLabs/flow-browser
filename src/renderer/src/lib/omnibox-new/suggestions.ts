import { generateTitleFromUrl } from "./helpers";
import { getSearchProvider } from "./search-providers";
import { getCachedUrlTitle } from "./states";
import type { SearchSuggestion, WebsiteSuggestion } from "./types";

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

export function createWebsiteSuggestion(
  url: string,
  relevance: number,
  overrideTitle: string | null
): WebsiteSuggestion {
  const cachedTitle = getCachedUrlTitle(url);
  const title = overrideTitle ?? cachedTitle ?? generateTitleFromUrl(url);
  return {
    type: "website",
    title,
    url,
    relevance
  };
}
