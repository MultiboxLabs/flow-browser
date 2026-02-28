import { AutocompleteMatch } from "@/lib/omnibox/types";
import { normalizeUrlForDedup } from "@/lib/omnibox/url-normalizer";

export class AutocompleteResult {
  private matches: AutocompleteMatch[] = [];
  private static MAX_RESULTS = 8; // Default limit for suggestions shown

  addMatch(match: AutocompleteMatch): void {
    this.matches.push(match);
  }

  addMatches(newMatches: AutocompleteMatch[]): void {
    this.matches.push(...newMatches);
  }

  clear(): void {
    this.matches = [];
  }

  /**
   * Deduplication using dedupKey (normalized URL) when available,
   * falling back to raw destinationUrl. Prioritizes higher relevance.
   */
  deduplicate(): void {
    const uniqueMatches = new Map<string, AutocompleteMatch>();
    // Sort first to process higher relevance scores first
    this.matches.sort((a, b) => b.relevance - a.relevance);

    for (const match of this.matches) {
      // Use dedupKey if set by the provider, otherwise normalize the destination URL
      const key = match.dedupKey ?? normalizeUrlForDedup(match.destinationUrl);
      if (!uniqueMatches.has(key)) {
        uniqueMatches.set(key, match);
      }
      // Future: merge properties when types differ (e.g., bookmark + history)
    }
    this.matches = Array.from(uniqueMatches.values());
  }

  sort(): void {
    // Primary sort by relevance (descending)
    this.matches.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      // Secondary: prefer matches allowed to be default
      if (a.allowedToBeDefault !== b.allowedToBeDefault) {
        return a.allowedToBeDefault ? -1 : 1;
      }
      return 0;
    });
  }

  getTopMatches(limit: number = AutocompleteResult.MAX_RESULTS): AutocompleteMatch[] {
    return this.matches.slice(0, limit);
  }
}
