import type { QuerySearchProviderCompletion, SearchProvider, SearchProviderRequest } from "./types";
import { mapSuggestionRelevanceByIndex } from "./suggestion-utils";
import { buildSearchUrlFromProviderId } from "~/search/search-settings";

type RawDuckDuckGoResponse = [string, string[]];

interface DuckDuckGoSuggestion {
  phrase: string;
}

interface DuckDuckGoSuggestionResponse {
  query: string;
  suggestions: DuckDuckGoSuggestion[] | null;
}

const DUCKDUCKGO_SUGGEST_BASE_URL = "https://duckduckgo.com/ac/";

function buildSearchUrl(query: string): string {
  return buildSearchUrlFromProviderId("duckduckgo", query);
}

function parseSuggestion(text: string, index: number): QuerySearchProviderCompletion | null {
  const completion: QuerySearchProviderCompletion = {
    kind: "query",
    title: text,
    query: text,
    relevance: mapSuggestionRelevanceByIndex(index)
  };
  return completion;
}

function mapDuckDuckGoResponse(response: RawDuckDuckGoResponse): DuckDuckGoSuggestionResponse {
  const [query, suggestions] = response;

  return {
    query,
    suggestions: suggestions.length > 0 ? suggestions.map((phrase) => ({ phrase })) : null
  };
}

async function fetchDuckDuckGoSuggestions({
  input,
  limit,
  signal
}: SearchProviderRequest): Promise<QuerySearchProviderCompletion[]> {
  const url = new URL(DUCKDUCKGO_SUGGEST_BASE_URL);
  url.searchParams.set("client", "chrome");
  url.searchParams.set("q", input);
  url.searchParams.set("type", "list");

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch DuckDuckGo suggestions: ${response.statusText}`);
  }
  const data = (await response.json()) as RawDuckDuckGoResponse;
  const mappedData = mapDuckDuckGoResponse(data);

  if (!mappedData.suggestions) {
    return [];
  }

  const completions: QuerySearchProviderCompletion[] = [];

  for (let i = 0; i < Math.min(mappedData.suggestions.length, limit); i++) {
    const suggestion = mappedData.suggestions[i];
    const completion = parseSuggestion(suggestion.phrase, i);
    if (completion) {
      completions.push(completion);
    }
  }

  return completions;
}

export const duckduckgoSearchProvider: SearchProvider = {
  id: "duckduckgo",
  label: "DuckDuckGo",
  buildSearchUrl,
  async getSuggestions(request: SearchProviderRequest): Promise<QuerySearchProviderCompletion[]> {
    const trimmedInput = request.input.trim();
    if (!trimmedInput) {
      return [];
    }

    const completions = await fetchDuckDuckGoSuggestions({ ...request, input: trimmedInput }).catch(() => []);
    return completions;
  }
};
