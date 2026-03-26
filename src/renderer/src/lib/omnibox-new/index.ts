import { getUniqueKeyFromUrl, guardOmniboxFlush, type OmniboxFlush } from "./helpers";
import { getOmniboxSuggestions } from "./suggestor";
import type { OmniboxSuggestion } from "./types";

export { guardOmniboxFlush, getUniqueKeyFromUrl, type OmniboxFlush } from "./helpers";
export { getOmniboxSuggestions } from "./suggestor";

function getSuggestionIdentity(suggestion: OmniboxSuggestion): string {
  switch (suggestion.type) {
    case "search":
      return `search:${suggestion.url}`;
    case "website":
      return `website:${getUniqueKeyFromUrl(suggestion.url)}`;
    case "open-tab":
      return `open-tab:${suggestion.spaceId}:${suggestion.tabId}`;
    case "pedal":
      return `pedal:${suggestion.action}`;
  }
}

export function sortOmniboxSuggestions(items: OmniboxSuggestion[]): OmniboxSuggestion[] {
  return [...items].sort((left, right) => right.relevance - left.relevance);
}

export function mergeOmniboxSuggestions(
  existing: OmniboxSuggestion[],
  incoming: OmniboxSuggestion[]
): OmniboxSuggestion[] {
  if (incoming.length === 0) {
    return existing;
  }

  const merged = new Map<string, OmniboxSuggestion>();

  for (const suggestion of existing) {
    const identity = getSuggestionIdentity(suggestion);
    merged.set(identity, suggestion);
  }

  for (const suggestion of incoming) {
    const identity = getSuggestionIdentity(suggestion);
    const existing = merged.get(identity);
    if (existing && existing.relevance > suggestion.relevance) {
      continue;
    }
    merged.set(identity, suggestion);
  }

  return sortOmniboxSuggestions(Array.from(merged.values()));
}

interface RequestOmniboxSuggestionsOptions {
  input: string;
  requestId: number;
  getCurrentRequestId: () => number;
  applySuggestions: OmniboxFlush;
}

export function requestOmniboxSuggestions({
  input,
  requestId,
  getCurrentRequestId,
  applySuggestions
}: RequestOmniboxSuggestionsOptions): void {
  let currentSuggestions: OmniboxSuggestion[] = [];

  const flush = guardOmniboxFlush(requestId, getCurrentRequestId, (items) => {
    currentSuggestions = mergeOmniboxSuggestions(currentSuggestions, items);
    applySuggestions(currentSuggestions);
  });

  getOmniboxSuggestions(input, flush);
}
