import { generateTitleFromUrl, isValidUrl } from "../helpers";
import { getSearchProvider } from "../search-providers";
import type { OmniboxSuggestion } from "../types";

const VERBATIM_MAX_RELEVANCE = 500;

export function getVerbatimSuggestions(trimmedInput: string): OmniboxSuggestion[] {
  const verbatimSuggestions: OmniboxSuggestion[] = [];

  // Website suggestion (if input can be normalized to a navigable URL)
  const targetUrl = isValidUrl(trimmedInput);
  if (targetUrl) {
    verbatimSuggestions.push({
      type: "website",
      title: generateTitleFromUrl(targetUrl),
      url: targetUrl,
      description: targetUrl,
      relevance: VERBATIM_MAX_RELEVANCE
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
      relevance: VERBATIM_MAX_RELEVANCE - 1
    });
  }

  return verbatimSuggestions;
}
