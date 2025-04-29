import { AutocompleteMatch } from "@/lib/omnibox/types";

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

  // Simple deduplication: prioritize higher relevance for the same destinationUrl
  deduplicate(): void {
    const uniqueMatches = new Map<string, AutocompleteMatch>();
    // Sort first to process higher relevance scores first
    this.matches.sort((a, b) => b.relevance - a.relevance);

    for (const match of this.matches) {
      const key = match.destinationUrl; // Use destination URL as the primary key
      if (!uniqueMatches.has(key)) {
        uniqueMatches.set(key, match);
      }
      // If a duplicate exists but the current one is a different type we might want to keep it?
      // The summary mentions merging, e.g. bookmark + history. This simple dedupe replaces.
      // A more complex logic could merge properties or keep both if types differ significantly.
    }
    this.matches = Array.from(uniqueMatches.values());
  }

  sort(): void {
    // Primary sort by relevance (descending)
    this.matches.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      // Add secondary sort criteria if needed (e.g., provider type, alphabetical)
      return 0;
    });
  }

  getTopMatches(limit: number = AutocompleteResult.MAX_RESULTS): AutocompleteMatch[] {
    return this.matches.slice(0, limit);
  }
}
