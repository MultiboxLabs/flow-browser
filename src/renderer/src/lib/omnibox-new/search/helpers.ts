import type { SearchProvider, SearchProviderCompletion } from "./types";

function completionIdentity(completion: SearchProviderCompletion): string {
  if (completion.kind === "navigation" && completion.url) {
    return `navigation:${completion.url}`;
  }

  if (completion.kind === "query" && completion.query) {
    return `query:${completion.query}`;
  }

  return `${completion.kind}:${completion.title}`;
}

export function resolveCompletionUrl(provider: SearchProvider, completion: SearchProviderCompletion): string | null {
  if (completion.kind === "navigation") {
    return completion.url ?? null;
  }

  if (completion.query) {
    return provider.buildSearchUrl(completion.query);
  }

  return null;
}

export function mergeSearchCompletions(
  completions: SearchProviderCompletion[],
  limit: number = completions.length
): SearchProviderCompletion[] {
  const deduped = new Map<string, SearchProviderCompletion>();

  const sorted = [...completions].sort((left, right) => {
    if (right.relevance !== left.relevance) {
      return right.relevance - left.relevance;
    }

    if (left.isVerbatim !== right.isVerbatim) {
      return left.isVerbatim ? -1 : 1;
    }

    return left.title.localeCompare(right.title);
  });

  for (const completion of sorted) {
    const identity = completionIdentity(completion);
    if (!deduped.has(identity)) {
      deduped.set(identity, completion);
    }
  }

  return Array.from(deduped.values()).slice(0, limit);
}
