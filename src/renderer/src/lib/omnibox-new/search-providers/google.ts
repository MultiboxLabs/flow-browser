import type { SearchProvider, SearchProviderCompletion, SearchProviderRequest } from "./types";

interface GoogleSuggestResponse {
  0?: string;
  1?: string[];
  2?: string[];
  3?: unknown[];
  4?: {
    "google:suggestrelevance"?: number[];
    "google:suggesttype"?: string[];
    "google:verbatimrelevance"?: number;
  };
}

type GoogleSuggestType = "QUERY" | "NAVIGATION" | "ENTITY" | "TAIL" | "CALCULATOR";

const GOOGLE_SEARCH_BASE_URL = "https://www.google.com/search";
const GOOGLE_SUGGEST_BASE_URL = "https://suggestqueries.google.com/complete/search";
const SEARCH_SUGGESTION_MIN_RELEVANCE = 100;
const SEARCH_SUGGESTION_MAX_RELEVANCE = 400;

function mapSuggestionRelevance(serverRelevance: number | undefined, index: number): number {
  const fallback = SEARCH_SUGGESTION_MIN_RELEVANCE;
  const clamped = Math.max(0, Math.min((serverRelevance ?? fallback) - index * 25, 1300));
  return Math.round(
    SEARCH_SUGGESTION_MIN_RELEVANCE +
      (clamped / 1300) * (SEARCH_SUGGESTION_MAX_RELEVANCE - SEARCH_SUGGESTION_MIN_RELEVANCE)
  );
}

function normalizeNavigationUrl(value: string): string | null {
  try {
    return new URL(value).toString();
  } catch {
    try {
      return new URL(`http://${value}`).toString();
    } catch {
      return null;
    }
  }
}

function buildSearchUrl(query: string): string {
  const url = new URL(GOOGLE_SEARCH_BASE_URL);
  url.searchParams.set("q", query);
  return url.toString();
}

function parseSuggestion(
  text: string,
  type: GoogleSuggestType | undefined,
  relevance: number | undefined,
  index: number
): SearchProviderCompletion | null {
  if (type === "NAVIGATION") {
    const url = normalizeNavigationUrl(text);
    if (!url) {
      return null;
    }

    return {
      kind: "navigation",
      title: null,
      url,
      description: url,
      relevance: mapSuggestionRelevance(relevance, index)
    };
  }

  return {
    kind: "query",
    title: text,
    query: text,
    relevance: mapSuggestionRelevance(relevance, index)
  };
}

async function fetchGoogleSuggestions({
  input,
  limit,
  signal
}: SearchProviderRequest): Promise<SearchProviderCompletion[]> {
  const url = new URL(GOOGLE_SUGGEST_BASE_URL);
  url.searchParams.set("client", "chrome");
  url.searchParams.set("q", input);

  const response = await fetch(url, { signal });
  const data = (await response.json()) as GoogleSuggestResponse;

  const texts = data[1] ?? [];
  const metadata = data[4];
  const types = metadata?.["google:suggesttype"] ?? [];
  const relevances = metadata?.["google:suggestrelevance"] ?? [];

  const completions: SearchProviderCompletion[] = [];

  for (let index = 0; index < texts.length && completions.length < limit; index += 1) {
    const text = texts[index];
    if (!text || text.toLowerCase() === input.toLowerCase()) {
      continue;
    }

    const completion = parseSuggestion(text, types[index] as GoogleSuggestType | undefined, relevances[index], index);
    if (completion) {
      completions.push(completion);
    }
  }

  return completions;
}

export const googleSearchProvider: SearchProvider = {
  id: "google",
  label: "Google",
  buildSearchUrl,
  async getSuggestions(request: SearchProviderRequest): Promise<SearchProviderCompletion[]> {
    const trimmedInput = request.input.trim();
    if (!trimmedInput) {
      return [];
    }

    const completions = await fetchGoogleSuggestions({ ...request, input: trimmedInput });
    return completions;
  }
};
