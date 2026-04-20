import { transformPotentialDisplayUrlToUrl } from "@/lib/url";
import { generateTitleFromUrl } from "./helpers";
import { getSearchProvider } from "./search-providers";
import { getCachedUrlTitle } from "./states";
import type { OmniboxSuggestionSource, SearchSuggestion, WebsiteSuggestion } from "./types";

export function createSearchSuggestion(
  query: string,
  relevance: number,
  overrideUrl: string | null,
  source: OmniboxSuggestionSource
): SearchSuggestion {
  const searchProvider = getSearchProvider();
  const url = overrideUrl === null ? searchProvider.buildSearchUrl(query) : overrideUrl;
  return {
    type: "search",
    query,
    url,
    relevance,
    source
  };
}

export function createWebsiteSuggestion(
  url: string,
  relevance: number,
  overrideTitle: string | null,
  source: OmniboxSuggestionSource
): WebsiteSuggestion {
  const transformedUrl = transformPotentialDisplayUrlToUrl(url) ?? url;
  const cachedTitle = getCachedUrlTitle(transformedUrl);
  const title = overrideTitle ?? cachedTitle ?? generateTitleFromUrl(transformedUrl);
  return {
    type: "website",
    title,
    url: transformedUrl,
    relevance,
    source
  };
}
