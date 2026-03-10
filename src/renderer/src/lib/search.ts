export function createSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

type SearchSuggestions = string[];

interface GoogleSuggestResponse {
  0: string; // Original query
  1: string[]; // Suggested queries
  2: string[]; // Description/unused array
  3: unknown[]; // Unknown/unused array
  4: {
    // Metadata
    "google:clientdata"?: {
      bpc: boolean;
      tlw: boolean;
    };
    "google:suggestrelevance"?: number[];
    "google:suggestsubtypes"?: number[][];
    "google:suggesttype"?: string[];
    "google:verbatimrelevance"?: number;
  };
}

/** Suggestion type as reported by Google's API. */
export type GoogleSuggestType = "QUERY" | "NAVIGATION" | "ENTITY" | "TAIL" | "CALCULATOR";

/** A single parsed suggestion with server-provided metadata. */
export interface ParsedSuggestion {
  /** The suggestion text (search query or URL for NAVIGATION). */
  text: string;
  /** Type reported by server. Defaults to QUERY if not provided. */
  type: GoogleSuggestType;
  /** Server-provided relevance score. Falls back to position-based if absent. */
  serverRelevance: number;
  /** For NAVIGATION type: the URL to navigate to (same as text). */
  url?: string;
}

/** Full parsed response from the Google Suggest API. */
export interface ParsedSearchResponse {
  /** The original query string. */
  query: string;
  /** Parsed suggestions with types and relevance. */
  suggestions: ParsedSuggestion[];
  /** Server-provided verbatim relevance, or undefined if absent. */
  verbatimRelevance: number | undefined;
}

/**
 * Parse a raw Google Suggest API response into structured suggestions
 * with server-provided relevance and type information.
 *
 * Design doc section 12.2.
 */
export function parseGoogleSuggestions(data: GoogleSuggestResponse): ParsedSearchResponse {
  const query = data[0];
  const texts = data[1] ?? [];
  const metadata = data[4];

  const relevances = metadata?.["google:suggestrelevance"] ?? [];
  const types = metadata?.["google:suggesttype"] ?? [];
  const verbatimRelevance = metadata?.["google:verbatimrelevance"];

  const suggestions: ParsedSuggestion[] = texts.map((text, i) => {
    const type = (types[i] as GoogleSuggestType) ?? "QUERY";
    const serverRelevance = relevances[i] ?? 600 - i * 50; // Fallback: position-based

    return {
      text,
      type,
      serverRelevance,
      url: type === "NAVIGATION" ? text : undefined
    };
  });

  return { query, suggestions, verbatimRelevance };
}

/**
 * Fetch search suggestions from Google Suggest API and return
 * the full parsed response including relevance scores and types.
 */
export async function getSearchSuggestionsWithMetadata(
  query: string,
  signal?: AbortSignal
): Promise<ParsedSearchResponse> {
  const baseURL = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
  const response = await fetch(baseURL, { signal });
  const data = (await response.json()) as GoogleSuggestResponse;
  return parseGoogleSuggestions(data);
}

/**
 * Fetch search suggestions (simple string array).
 * Kept for backward compatibility.
 */
export async function getSearchSuggestions(query: string, signal?: AbortSignal): Promise<SearchSuggestions> {
  const baseURL = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
  const response = await fetch(baseURL, { signal });
  const data = (await response.json()) as GoogleSuggestResponse;
  return data[1];
}
