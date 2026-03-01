/**
 * SearchProvider — Phase 3 Enhancement
 *
 * Generates verbatim search match (synchronous) and Google Suggest API
 * suggestions (asynchronous) with full server metadata parsing.
 *
 * Per design doc sections 10.3 and 12:
 *   - Parse server relevance scores (google:suggestrelevance)
 *   - Parse suggestion types (google:suggesttype)
 *   - Handle NAVIGATION-type suggestions as navsuggest matches
 *   - Use google:verbatimrelevance for verbatim match scoring
 *   - Debounce network requests (50ms after typing pause)
 *   - Cancel in-flight requests on new input (AbortController)
 *
 * Max results: 1 verbatim + up to 5 suggestions
 * Match types: verbatim, search-query, navsuggest
 */

import { BaseProvider } from "@/lib/omnibox/base-provider";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput, AutocompleteMatch, InputType } from "@/lib/omnibox/types";
import { createSearchUrl, getSearchSuggestionsWithMetadata, type ParsedSuggestion } from "@/lib/search";
import { normalizeUrlForDedup } from "@/lib/omnibox/url-normalizer";

/** Max remote suggestions to include. */
const MAX_SUGGESTIONS = 5;

/** Debounce delay in ms before sending network request. */
const DEBOUNCE_MS = 50;

/**
 * Map server relevance to our relevance range.
 *
 * Google's server relevance typically ranges from ~100 to ~1200+.
 * We map these into our search-query range (300-1000) to stay below
 * verbatim/history matches while preserving relative ordering.
 *
 * For navsuggest matches, we use a higher range (600-1100) since the
 * server is confident the suggestion is a navigable URL.
 */
function mapServerRelevance(serverRelevance: number, type: ParsedSuggestion["type"]): number {
  if (type === "NAVIGATION") {
    // Navsuggest: server is confident this is a URL, map to 600-1100
    // Typical server values: 500-900
    const clamped = Math.max(0, Math.min(serverRelevance, 1300));
    return Math.round(600 + (clamped / 1300) * 500);
  }

  // Regular search suggestions: map to 300-1000
  // Typical server values: 100-800
  const clamped = Math.max(0, Math.min(serverRelevance, 1300));
  return Math.round(300 + (clamped / 1300) * 700);
}

/**
 * Map server verbatim relevance to our range.
 *
 * Google's verbatimrelevance is typically 851-1300. We blend it with
 * our input-type-based defaults.
 */
function mapVerbatimRelevance(serverVerbatimRelevance: number | undefined, inputType: InputType): number {
  // Our input-type-based defaults (same as before)
  let baseRelevance: number;
  switch (inputType) {
    case InputType.URL:
      baseRelevance = 1100; // Below what-you-typed URL (1200)
      break;
    case InputType.FORCED_QUERY:
      baseRelevance = 1350; // User explicitly wants search
      break;
    case InputType.QUERY:
      baseRelevance = 1300; // Clearly a search query
      break;
    case InputType.UNKNOWN:
    default:
      baseRelevance = 1300; // Search-first for ambiguous input
      break;
  }

  if (serverVerbatimRelevance === undefined) {
    return baseRelevance;
  }

  // Blend: use server value as a signal, but respect our input-type logic.
  // If server says low verbatim, we reduce our score; if high, we keep ours.
  // Server typically sends 851 for normal queries, higher when confident.
  if (serverVerbatimRelevance >= 1300) {
    // Server is very confident — trust it (but still cap by input type)
    return Math.max(baseRelevance, Math.min(serverVerbatimRelevance, 1400));
  } else if (serverVerbatimRelevance < 600) {
    // Server says verbatim is very low relevance — reduce ours
    return Math.min(baseRelevance, 1100);
  }

  // Normal range: keep our input-type-based relevance
  return baseRelevance;
}

export class SearchProvider extends BaseProvider {
  name = "SearchProvider";

  /** Abort controller for cancelling in-flight network requests. */
  private abortController: AbortController | null = null;

  /** Debounce timer for delaying network requests. */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    const inputText = input.text;

    if (!inputText) {
      onResults([]);
      return;
    }

    // --- Synchronous: emit verbatim match immediately ---
    const verbatimRelevance = mapVerbatimRelevance(undefined, input.inputType);

    const verbatimMatch: AutocompleteMatch = {
      providerName: this.name,
      relevance: verbatimRelevance,
      contents: inputText,
      description: `Search for "${inputText}"`,
      destinationUrl: createSearchUrl(inputText),
      type: "verbatim",
      isDefault: input.inputType !== InputType.URL,
      scoringSignals: {
        typedCount: 0,
        visitCount: 0,
        elapsedTimeSinceLastVisit: 0,
        frecency: 0,
        matchQualityScore: 0,
        hostMatchAtWordBoundary: false,
        hasNonSchemeWwwMatch: false,
        isHostOnly: false,
        isBookmarked: false,
        hasOpenTabMatch: false,
        urlLength: 0,
        isVerbatim: true,
        searchSuggestRelevance: verbatimRelevance
      }
    };
    onResults([verbatimMatch], true); // continuous=true: more results coming

    // --- Asynchronous: fetch remote suggestions with debounce ---

    // Cancel any pending debounce timer
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Cancel any in-flight request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const abortSignal = this.abortController.signal;

    // Debounce: wait DEBOUNCE_MS before sending network request
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.fetchAndEmitSuggestions(inputText, input, abortSignal, onResults);
    }, DEBOUNCE_MS);
  }

  /**
   * Fetch suggestions from Google Suggest API and emit parsed results.
   */
  private async fetchAndEmitSuggestions(
    query: string,
    input: AutocompleteInput,
    signal: AbortSignal,
    onResults: OmniboxUpdateCallback
  ): Promise<void> {
    try {
      const parsed = await getSearchSuggestionsWithMetadata(query, signal);

      if (signal.aborted) return;

      // --- Update verbatim with server-provided relevance ---
      // If server provides verbatimrelevance, re-emit verbatim with adjusted score
      if (parsed.verbatimRelevance !== undefined) {
        const adjustedVerbatim = mapVerbatimRelevance(parsed.verbatimRelevance, input.inputType);
        const updatedVerbatim: AutocompleteMatch = {
          providerName: this.name,
          relevance: adjustedVerbatim,
          contents: input.text,
          description: `Search for "${input.text}"`,
          destinationUrl: createSearchUrl(input.text),
          type: "verbatim",
          isDefault: input.inputType !== InputType.URL,
          scoringSignals: {
            typedCount: 0,
            visitCount: 0,
            elapsedTimeSinceLastVisit: 0,
            frecency: 0,
            matchQualityScore: 0,
            hostMatchAtWordBoundary: false,
            hasNonSchemeWwwMatch: false,
            isHostOnly: false,
            isBookmarked: false,
            hasOpenTabMatch: false,
            urlLength: 0,
            isVerbatim: true,
            searchSuggestRelevance: parsed.verbatimRelevance
          }
        };

        // Emit updated verbatim + suggestions together
        const suggestions = this.buildSuggestionMatches(parsed.suggestions, input);
        onResults([updatedVerbatim, ...suggestions]);
      } else {
        // No verbatim update — just emit suggestions
        const suggestions = this.buildSuggestionMatches(parsed.suggestions, input);
        onResults(suggestions);
      }
    } catch (error) {
      if (signal.aborted) return;
      console.error("SearchProvider: suggestion fetch error:", error);
      onResults([]); // Empty results on error
    }
  }

  /**
   * Build AutocompleteMatch objects from parsed suggestions.
   * Handles both QUERY and NAVIGATION types.
   */
  private buildSuggestionMatches(suggestions: ParsedSuggestion[], input: AutocompleteInput): AutocompleteMatch[] {
    const results: AutocompleteMatch[] = [];
    let count = 0;

    for (const suggestion of suggestions) {
      if (count >= MAX_SUGGESTIONS) break;

      // Skip suggestions that are identical to the input (that's what verbatim is for)
      if (suggestion.text.toLowerCase() === input.text.toLowerCase()) continue;

      if (suggestion.type === "NAVIGATION") {
        // NavSuggest: server says this is a URL, not a query
        const navMatch = this.buildNavSuggestMatch(suggestion, input);
        if (navMatch) {
          results.push(navMatch);
          count++;
        }
      } else {
        // Regular search suggestion (QUERY, ENTITY, TAIL, CALCULATOR)
        const searchMatch = this.buildSearchQueryMatch(suggestion, input);
        results.push(searchMatch);
        count++;
      }
    }

    return results;
  }

  /**
   * Build a navsuggest match from a NAVIGATION-type suggestion.
   *
   * NavSuggest matches navigate directly to a URL instead of searching.
   * They get higher relevance than regular search suggestions because
   * the server is confident the user wants this URL.
   */
  private buildNavSuggestMatch(suggestion: ParsedSuggestion, _input: AutocompleteInput): AutocompleteMatch | null {
    const url = suggestion.url ?? suggestion.text;

    // Validate that this looks like a real URL
    try {
      new URL(url);
    } catch {
      // If the text isn't a valid URL, try prepending https://
      try {
        new URL(`https://${url}`);
      } catch {
        // Not a valid URL at all — fall back to search query
        return null;
      }
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const relevance = mapServerRelevance(suggestion.serverRelevance, "NAVIGATION");

    return {
      providerName: this.name,
      relevance,
      contents: suggestion.text,
      description: normalizedUrl,
      destinationUrl: normalizedUrl,
      type: "navsuggest",
      dedupKey: normalizeUrlForDedup(normalizedUrl),
      scoringSignals: {
        typedCount: 0,
        visitCount: 0,
        elapsedTimeSinceLastVisit: 0,
        frecency: 0,
        matchQualityScore: 0,
        hostMatchAtWordBoundary: false,
        hasNonSchemeWwwMatch: false,
        isHostOnly: false,
        isBookmarked: false,
        hasOpenTabMatch: false,
        urlLength: normalizedUrl.length,
        isNavSuggest: true,
        searchSuggestRelevance: suggestion.serverRelevance
      }
    };
  }

  /**
   * Build a search-query match from a regular suggestion.
   * Uses server relevance for ordering while keeping scores in the search range.
   */
  private buildSearchQueryMatch(suggestion: ParsedSuggestion, _input: AutocompleteInput): AutocompleteMatch {
    const relevance = mapServerRelevance(suggestion.serverRelevance, suggestion.type);
    const destinationUrl = createSearchUrl(suggestion.text);

    return {
      providerName: this.name,
      relevance,
      contents: suggestion.text,
      destinationUrl,
      type: "search-query",
      scoringSignals: {
        typedCount: 0,
        visitCount: 0,
        elapsedTimeSinceLastVisit: 0,
        frecency: 0,
        matchQualityScore: 0,
        hostMatchAtWordBoundary: false,
        hasNonSchemeWwwMatch: false,
        isHostOnly: false,
        isBookmarked: false,
        hasOpenTabMatch: false,
        urlLength: 0,
        searchSuggestRelevance: suggestion.serverRelevance
      }
    };
  }

  stop(): void {
    // Cancel debounce timer
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    // Cancel in-flight network request
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
