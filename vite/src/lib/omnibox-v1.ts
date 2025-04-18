// THIS IS NOT BEING USED, STORED HERE FOR REFERENCE!

import { getURLFromInput } from "@/lib/url";
import { createSearchUrl, getSearchSuggestions } from "./search";

export async function getNewTabMode() {
  // Replaced with a static value bc old function is removed.
  return "omnibox";
}

/**
 * The type of input the user has entered
 */
export enum OmniboxInputType {
  /** Input is a URL */
  URL = "url",
  /** Input is a search query */
  QUERY = "query",
  /** Input could be either a URL or a search query */
  UNKNOWN = "unknown"
}

/**
 * Represents a suggestion displayed in the omnibox dropdown
 */
export interface OmniboxMatch {
  /** The destination URL for this match */
  destinationUrl: string;
  /** The text to display in the main line */
  content: string;
  /** The descriptive text to display in the second line */
  description?: string;
  /** Whether this match is allowed to be the default match */
  allowedToBeDefault: boolean;
  /** Whether this match should be inline autocompleted */
  allowInlineAutocompletion: boolean;
  /** The type of match */
  type: "history" | "search" | "bookmark" | "tab" | "navigation" | "verbatim";
  /** The relevance score for this match (higher = more relevant) */
  relevance: number;
}

/**
 * Contains user input and metadata for autocomplete processing
 */
export interface OmniboxInput {
  /** The text the user has entered */
  text: string;
  /** The calculated type of the input */
  type: OmniboxInputType;
  /** The position of the cursor in the input */
  cursorPosition: number;
  /** Whether inline autocompletion should be allowed */
  allowInlineAutocompletion: boolean;
  /** Whether the user is in keyword mode */
  inKeywordMode: boolean;
}

/**
 * Contains the results of an autocomplete operation
 */
export interface OmniboxResult {
  /** All matches for the current input */
  matches: OmniboxMatch[];
  /** The default match (the one that will be navigated to on Enter) */
  defaultMatch: OmniboxMatch | null;
}

/**
 * Parses the input to determine its type (URL, QUERY, or UNKNOWN)
 */
export function parseInput(input: string): OmniboxInputType {
  if (!input) return OmniboxInputType.UNKNOWN;

  if (getURLFromInput(input)) return OmniboxInputType.URL;

  // Simple heuristic: if it contains spaces, it's a query
  if (input.includes(" ")) return OmniboxInputType.QUERY;

  // Otherwise, we can't be sure
  return OmniboxInputType.UNKNOWN;
}

/**
 * Creates an OmniboxInput object from user input
 */
export function createOmniboxInput(
  text: string,
  cursorPosition = text.length,
  allowInlineAutocompletion = true,
  inKeywordMode = false
): OmniboxInput {
  return {
    text,
    type: parseInput(text),
    cursorPosition,
    allowInlineAutocompletion,
    inKeywordMode
  };
}

/**
 * Creates a verbatim match for the input
 */
export function createVerbatimMatch(input: OmniboxInput): OmniboxMatch {
  const isUrl = input.type === OmniboxInputType.URL;

  return {
    destinationUrl: isUrl
      ? input.text.startsWith("http")
        ? input.text
        : getURLFromInput(input.text) || "about:blank"
      : createSearchUrl(input.text),
    content: input.text,
    description: isUrl ? "" : "Search Google for",
    allowedToBeDefault: true,
    allowInlineAutocompletion: false,
    type: isUrl ? "verbatim" : "search",
    relevance: isUrl ? 1200 : 1100 // High relevance for verbatim URL matches
  };
}

/**
 * Strips a URL to its essential components for comparison
 * (removes scheme, www, and trailing slashes)
 */
export function stripUrl(url: string): string {
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

/**
 * Determines if two URLs should be considered duplicates
 */
export function areDuplicateUrls(url1: string, url2: string): boolean {
  return stripUrl(url1) === stripUrl(url2);
}

/**
 * Sorts and filters matches to produce a final result set
 */
export function sortAndCullMatches(matches: OmniboxMatch[]): OmniboxResult {
  // Sort by relevance score
  const sortedMatches = [...matches].sort((a, b) => b.relevance - a.relevance);

  // Remove duplicates, keeping the highest-scoring version
  const uniqueMatches: OmniboxMatch[] = [];
  const seenUrls = new Set<string>();

  for (const match of sortedMatches) {
    const strippedUrl = stripUrl(match.destinationUrl);
    if (!seenUrls.has(strippedUrl)) {
      uniqueMatches.push(match);
      seenUrls.add(strippedUrl);
    }
  }

  // Limit to maximum number of matches
  const finalMatches = uniqueMatches.slice(0, 5);

  // Find the highest-relevance match that can be default
  const defaultMatch = finalMatches.find((match) => match.allowedToBeDefault) || null;

  // If there's a default match and it's not at the front, move it there
  if (defaultMatch && finalMatches[0] !== defaultMatch) {
    const index = finalMatches.indexOf(defaultMatch);
    finalMatches.splice(index, 1);
    finalMatches.unshift(defaultMatch);
  }

  return {
    matches: finalMatches,
    defaultMatch
  };
}

/**
 * Create search suggestion matches from the given suggestions
 */
export function createSearchSuggestionMatches(input: OmniboxInput, suggestions: string[]): OmniboxMatch[] {
  const startingRelevance = 1000; // Start below verbatim search

  return suggestions.map((suggestion, index) => {
    const relevance = startingRelevance - index * 10; // Decrease relevance for each suggestion

    return {
      destinationUrl: createSearchUrl(suggestion),
      content: suggestion,
      description: "Search Google for",
      allowedToBeDefault: true,
      // Only allow inline autocompletion if the suggestion starts with the input text
      // and autocompletion is allowed for this input
      allowInlineAutocompletion:
        input.allowInlineAutocompletion && suggestion.toLowerCase().startsWith(input.text.toLowerCase()),
      type: "search",
      relevance
    };
  });
}

/**
 * Handles user input and returns appropriate matches
 */
export async function handleOmniboxInput(
  input: string,
  signal?: AbortSignal,
  // Used for updating before this promise is resolved & after
  updateCallback?: (matches: OmniboxMatch[]) => void
): Promise<OmniboxResult> {
  const omniboxInput = createOmniboxInput(input);
  const matches: OmniboxMatch[] = [];

  // Always add a verbatim match
  matches.push(createVerbatimMatch(omniboxInput));
  updateCallback?.(matches);

  // Here you would add calls to various providers:
  // - History matches
  // - Bookmark matches
  // - Search suggestions
  // - Etc.

  // Only fetch search suggestions for query-like inputs and when there's actual text
  if (
    (omniboxInput.type === OmniboxInputType.QUERY || omniboxInput.type === OmniboxInputType.UNKNOWN) &&
    omniboxInput.text.trim().length > 0
  ) {
    try {
      const suggestions = await getSearchSuggestions(omniboxInput.text, signal);
      const suggestionMatches = createSearchSuggestionMatches(omniboxInput, suggestions);
      matches.push(...suggestionMatches);
    } catch (error) {
      // Handle network errors or aborted requests silently
      console.log("Failed to fetch search suggestions:", error);
    }
  }

  const finalResults = sortAndCullMatches(matches);
  updateCallback?.(finalResults.matches);
  return finalResults;
}
