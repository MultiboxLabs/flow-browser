export type SearchCompletionKind = "query" | "navigation";

export interface SearchProviderRequest {
  input: string;
  limit: number;
  signal: AbortSignal;
}

export interface SearchProviderCompletion {
  kind: SearchCompletionKind;
  title: string;
  relevance: number;
  query?: string;
  url?: string;
  description?: string;
  isVerbatim?: boolean;
  providerPayload?: unknown;
}

export interface SearchProvider {
  id: string;
  label: string;
  buildSearchUrl(query: string): string;
  getSuggestions?(request: SearchProviderRequest): Promise<SearchProviderCompletion[]>;
}

export type SearchProviderResolver = () => SearchProvider;
