import { isValidUrl } from "../helpers";
import type { OmniboxSuggestion } from "../types";
import { createSearchSuggestion, createWebsiteSuggestion } from "../suggestions";

const VERBATIM_URL_RELEVANCE = 500;
const VERBATIM_SEARCH_RELEVANCE = 499;

type BangEntry = {
  /** category */
  c?: string;
  /** subcategory */
  sc?: string;
  /** domain */
  d: string;
  /** relevance */
  r: number;
  /** display name / site name */
  s: string;
  /** bang trigger text */
  t: string;
  /** search url template, with {{{s}}} replaced with the search query */
  u: string;
};

// Instead of importing the bangs module directly, we preload it so the omnibox can be initialized faster.
let bangs: BangEntry[] | undefined;
let bangsPromise: Promise<typeof bangs> | undefined;
async function preloadBangs() {
  if (bangs) return false;
  const bangsModule = (await import("../bangs")) as unknown as { bangs: BangEntry[] };
  bangs = bangsModule.bangs as BangEntry[];
  return true;
}
function getBangs() {
  if (bangs) return bangs;
  if (!bangsPromise) {
    bangsPromise = preloadBangs().then(() => {
      bangsPromise = undefined;
      return bangs;
    });
  }
  return [];
}

getBangs();

// Bangs implementation mostly taken from unduck
// https://github.com/T3-Content/unduck/blob/c1b821de0ffa286cfd964817d1918c5e90545db4/src/main.ts#L50
function getBangSearchUrl(query: string): string | null {
  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const bangs = getBangs();
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
    const websiteSuggestion = createWebsiteSuggestion(targetUrl, VERBATIM_URL_RELEVANCE, null, "verbatim");
    verbatimSuggestions.push(websiteSuggestion);
  }

  // Search suggestion
  const bangSearchUrl = getBangSearchUrl(trimmedInput);
  verbatimSuggestions.push(createSearchSuggestion(trimmedInput, VERBATIM_SEARCH_RELEVANCE, bangSearchUrl, "verbatim"));

  return verbatimSuggestions;
}
