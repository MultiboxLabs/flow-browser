import { getSearchProvider } from "@/lib/omnibox-new/search-providers";

type SearchSuggestions = string[];

export function createSearchUrl(query: string): string {
  return getSearchProvider().buildSearchUrl(query);
}

export async function getSearchSuggestions(query: string, signal?: AbortSignal): Promise<SearchSuggestions> {
  const searchProvider = getSearchProvider();
  if (!searchProvider.getSuggestions) {
    return [];
  }

  const completions = await searchProvider.getSuggestions({
    input: query,
    limit: 10,
    signal
  });

  return completions.filter((completion) => completion.kind === "query").map((completion) => completion.query);
}
