import { isValidUrl } from "./helpers";
import type { OmniboxSuggestion } from "./types";

const HIGHEST_RELEVANCE = 999999;

/**
 * Produce omnibox rows for the current input. Call `flush` whenever the list changes
 * (once or multiple times for incremental updates).
 */
export function getOmniboxSuggestions(input: string, flush: (items: OmniboxSuggestion[]) => void): void {
  // Implement: derive suggestions from `input`, then flush(results).
  if (!input) {
    flush([]);
    return;
  }

  const initialSuggestions: OmniboxSuggestion[] = [];

  // Website suggestion (if input can be normalized to a navigable URL)
  const targetUrl = isValidUrl(input);
  if (targetUrl) {
    initialSuggestions.push({
      type: "website",
      title: targetUrl,
      url: targetUrl,
      description: targetUrl,
      relevance: HIGHEST_RELEVANCE
    });
  }

  // Search suggestion
  initialSuggestions.push({
    type: "search",
    query: input,
    relevance: HIGHEST_RELEVANCE - 1
  });

  flush(initialSuggestions);
}
