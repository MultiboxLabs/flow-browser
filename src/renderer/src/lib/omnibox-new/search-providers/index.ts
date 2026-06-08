import { duckduckgoSearchProvider } from "./duckduckgo";
import { googleSearchProvider } from "./google";
import type { SearchProvider } from "./types";

export const searchProviders = {
  duckduckgo: duckduckgoSearchProvider,
  google: googleSearchProvider
} satisfies Record<string, SearchProvider>;

export type SearchProviderId = keyof typeof searchProviders;

export function getSearchProvider(id: SearchProviderId = "google"): SearchProvider {
  return searchProviders[id];
}
