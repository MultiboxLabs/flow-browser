export interface SearchProviderRequest {
  input: string;
  limit: number;
  signal: AbortSignal;
}

interface SearchProviderCompletionBase {
  title: string | null;
  relevance: number;
  description?: string;
  isVerbatim?: boolean;
  providerPayload?: unknown;
}

export interface QuerySearchProviderCompletion extends SearchProviderCompletionBase {
  kind: "query";
  query: string;
}

export interface NavigationSearchProviderCompletion extends SearchProviderCompletionBase {
  kind: "navigation";
  url: string;
}
export type SearchProviderCompletion = QuerySearchProviderCompletion | NavigationSearchProviderCompletion;

export interface SearchProvider {
  id: string;
  label: string;
  buildSearchUrl(query: string): string;
  getSuggestions?(request: SearchProviderRequest): Promise<SearchProviderCompletion[]>;
}

export type SearchProviderResolver = () => SearchProvider;
