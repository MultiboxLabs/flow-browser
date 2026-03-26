import { isValidUrl, type OmniboxFlush } from "./helpers";
import { resolveCompletionUrl } from "./search/helpers";
import { getSearchProvider } from "./search/index";
import type { OmniboxSuggestion } from "./types";

export { guardOmniboxFlush, type OmniboxFlush } from "./helpers";

const HIGHEST_RELEVANCE = 999999;

function getVerbatimSuggestions(input: string): OmniboxSuggestion[] {
  const verbatimSuggestions: OmniboxSuggestion[] = [];

  // Website suggestion (if input can be normalized to a navigable URL)
  const targetUrl = isValidUrl(input);
  if (targetUrl) {
    verbatimSuggestions.push({
      type: "website",
      title: targetUrl,
      url: targetUrl,
      description: targetUrl,
      relevance: HIGHEST_RELEVANCE
    });
  }

  // Search suggestion
  const searchProvider = getSearchProvider();
  const searchCompletion = searchProvider.getVerbatimCompletion(input);
  const searchUrl = searchCompletion ? resolveCompletionUrl(searchProvider, searchCompletion) : null;

  if (searchCompletion?.query && searchUrl) {
    verbatimSuggestions.push({
      type: "search",
      query: searchCompletion.query,
      url: searchUrl,
      relevance: HIGHEST_RELEVANCE - 1
    });
  }

  return verbatimSuggestions;
}

/**
 * Produce omnibox rows for the current input. Call `flush` whenever the list changes
 * (once or multiple times for incremental updates).
 *
 * For async work, pass a `flush` wrapped with {@link guardOmniboxFlush} at the call
 * site so stale completions cannot overwrite a newer query.
 */
export function getOmniboxSuggestions(input: string, flush: OmniboxFlush): void {
  // Implement: derive suggestions from `input`, then flush(results).
  if (!input) {
    flush([]);
    return;
  }

  // Verbatim suggestions
  const verbatimSuggestions = getVerbatimSuggestions(input);
  flush(verbatimSuggestions);
}
