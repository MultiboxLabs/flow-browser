import type {
  NavigationSearchProviderCompletion,
  QuerySearchProviderCompletion,
  SearchProvider,
  SearchProviderRequest
} from "./types";

type RawYandexSuggestion =
  | string
  | [kind: string, text: string, description?: string, urlOrHost?: string, ...extra: unknown[]];

type RawYandexSuggestResponse = [query?: string, suggestions?: RawYandexSuggestion[], ...extra: unknown[]];

interface YandexSuggestion {
  phrase: string;
  kind: "query" | "navigation";
  url?: string;
  description?: string;
}

const YANDEX_SEARCH_BASE_URL = "https://yandex.com/search/";
const YANDEX_SUGGEST_BASE_URL = "https://suggest.yandex.com/suggest-ff.cgi";

function buildSearchUrl(query: string): string {
  const url = new URL(YANDEX_SEARCH_BASE_URL);
  url.searchParams.set("text", query);
  return url.toString();
}

function mapSuggestionRelevance(index: number): number {
  return Math.max(100, 400 - index * 40);
}

function normalizeNavigationUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    try {
      return new URL(`https://${value}`);
    } catch {
      return null;
    }
  }
}

const isAllowedProtocol = (url: URL): boolean => ["http:", "https:"].includes(url.protocol.toLowerCase());

function normalizeAndValidateUrl(value: string): string | null {
  const url = normalizeNavigationUrl(value);
  if (!url) {
    return null;
  }

  if (!isAllowedProtocol(url)) {
    return null;
  }

  return url.toString();
}

function parseRawSuggestion(suggestion: RawYandexSuggestion): YandexSuggestion | null {
  if (typeof suggestion === "string") {
    return {
      kind: "query",
      phrase: suggestion
    };
  }

  const [kind, text, description, urlOrHost] = suggestion;
  const normalizedKind = kind.toLowerCase();

  if (!text) {
    return null;
  }

  if (normalizedKind === "nav") {
    const rawUrl = urlOrHost ?? text;
    const url = normalizeAndValidateUrl(rawUrl);

    if (!url) {
      return null;
    }

    return {
      kind: "navigation",
      phrase: text,
      url,
      description: description ?? url
    };
  }

  return {
    kind: "query",
    phrase: text,
    description
  };
}

function parseSuggestion(
  suggestion: YandexSuggestion,
  index: number
): QuerySearchProviderCompletion | NavigationSearchProviderCompletion | null {
  if (suggestion.kind === "navigation") {
    if (!suggestion.url) {
      return null;
    }

    const completion: NavigationSearchProviderCompletion = {
      kind: "navigation",
      title: suggestion.phrase,
      url: suggestion.url,
      description: suggestion.description ?? suggestion.url,
      relevance: mapSuggestionRelevance(index)
    };

    return completion;
  }

  const completion: QuerySearchProviderCompletion = {
    kind: "query",
    title: suggestion.phrase,
    query: suggestion.phrase,
    description: suggestion.description,
    relevance: mapSuggestionRelevance(index)
  };

  return completion;
}

function mapYandexResponse(response: RawYandexSuggestResponse): YandexSuggestion[] {
  const [, rawSuggestions = []] = response;

  return rawSuggestions
    .map(parseRawSuggestion)
    .filter((suggestion): suggestion is YandexSuggestion => suggestion !== null);
}

async function fetchYandexSuggestions({
  input,
  limit,
  signal
}: SearchProviderRequest): Promise<Array<QuerySearchProviderCompletion | NavigationSearchProviderCompletion>> {
  const url = new URL(YANDEX_SUGGEST_BASE_URL);
  url.searchParams.set("part", input);
  url.searchParams.set("uil", "en");
  url.searchParams.set("v", "3");
  url.searchParams.set("sn", String(limit));

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch Yandex suggestions: ${response.statusText}`);
  }

  const data = (await response.json()) as RawYandexSuggestResponse;
  const suggestions = mapYandexResponse(data);

  if (suggestions.length === 0) {
    return [];
  }

  const completions: Array<QuerySearchProviderCompletion | NavigationSearchProviderCompletion> = [];

  for (let index = 0; index < suggestions.length && completions.length < limit; index += 1) {
    const suggestion = suggestions[index];

    if (suggestion.phrase.toLowerCase() === input.toLowerCase()) {
      continue;
    }

    const completion = parseSuggestion(suggestion, index);

    if (completion) {
      completions.push(completion);
    }
  }

  return completions;
}

export const yandexSearchProvider: SearchProvider = {
  id: "yandex",
  label: "Yandex",
  buildSearchUrl,
  async getSuggestions(
    request: SearchProviderRequest
  ): Promise<Array<QuerySearchProviderCompletion | NavigationSearchProviderCompletion>> {
    const trimmedInput = request.input.trim();

    if (!trimmedInput) {
      return [];
    }

    const completions = await fetchYandexSuggestions({ ...request, input: trimmedInput }).catch(() => []);
    return completions;
  }
};
