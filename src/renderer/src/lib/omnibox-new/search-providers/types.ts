export interface SearchProviderRequest {
  input: string;
  limit: number;
  signal?: AbortSignal;
}

export type SearchProviderCompletionKind = "query" | "navigation";

interface SearchProviderCompletionBase {
  title: string | null;
  relevance: number;
  description?: string;
  isVerbatim?: boolean;
  providerPayload?: unknown;
  kind: SearchProviderCompletionKind;
}

export interface QuerySearchProviderCompletion extends SearchProviderCompletionBase {
  query: string;
  kind: "query";
}

export interface NavigationSearchProviderCompletion extends SearchProviderCompletionBase {
  url: string;
  kind: "navigation";
}

export type SearchProviderCompletion = QuerySearchProviderCompletion | NavigationSearchProviderCompletion;

export interface SearchProvider<TCompletion extends SearchProviderCompletion = SearchProviderCompletion> {
  id: string;
  label: string;
  buildSearchUrl(query: string): string;
  getSuggestions?(request: SearchProviderRequest): Promise<TCompletion[]>;
}

export type SearchProviderResolver<TCompletion extends SearchProviderCompletion = SearchProviderCompletion> =
  () => SearchProvider<TCompletion>;
