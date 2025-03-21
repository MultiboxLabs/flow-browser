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
    "google:clientdata": {
      bpc: boolean;
      tlw: boolean;
    };
    "google:suggestrelevance": number[];
    "google:suggestsubtypes": number[][];
    "google:suggesttype": string[];
    "google:verbatimrelevance": number;
  };
}

export async function getSearchSuggestions(query: string, signal?: AbortSignal): Promise<SearchSuggestions> {
  const baseURL = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
  const response = await fetch(baseURL, { signal });
  const data = (await response.json()) as GoogleSuggestResponse;
  return data[1];
}
