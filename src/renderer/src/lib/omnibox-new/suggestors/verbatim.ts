import { generateTitleFromUrl, isValidUrl } from "../helpers";
import type { OmniboxSuggestion } from "../types";
import { createSearchSuggestion, createWebsiteSuggestion } from "../suggestions";
import { bangs } from "../bangs";

const VERBATIM_URL_RELEVANCE = 500;
const VERBATIM_SEARCH_RELEVANCE = 499;

// Bangs implementation mostly taken from unduck
// https://github.com/T3-Content/unduck/blob/c1b821de0ffa286cfd964817d1918c5e90545db4/src/main.ts#L50
function getBangSearchUrl(query: string): string | null {
  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = bangs.find((b) => b.t === bangCandidate);
  if (!selectedBang) return null;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
  if (cleanQuery === "") return selectedBang ? `https://${selectedBang.d}` : null;

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/")
  );
  if (!searchUrl) return null;

  return searchUrl;
}

export function getVerbatimSuggestions(trimmedInput: string): OmniboxSuggestion[] {
  const verbatimSuggestions: OmniboxSuggestion[] = [];

  // Website suggestion (if input can be normalized to a navigable URL)
  const targetUrl = isValidUrl(trimmedInput);
  if (targetUrl) {
    const websiteSuggestion = createWebsiteSuggestion(targetUrl, VERBATIM_URL_RELEVANCE, null);
    verbatimSuggestions.push(websiteSuggestion);
  }

  // Search suggestion
  const bangSearchUrl = getBangSearchUrl(trimmedInput);
  verbatimSuggestions.push(createSearchSuggestion(trimmedInput, VERBATIM_SEARCH_RELEVANCE, bangSearchUrl));

  return verbatimSuggestions;
}
