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
   *
   * Cross-provider merge rules (design doc section 8.2):
   *   - If one match is a bookmark and the other is history, mark as bookmarked
   *   - If one match is a shortcut and the other is history, keep the higher-scored one
   *   - Preserve scoring signals from both matches where useful
   */
  deduplicate(): void {
    const uniqueMatches = new Map<string, AutocompleteMatch>();
    // Sort first to process higher relevance scores first
    this.matches.sort((a, b) => b.relevance - a.relevance);

    for (const match of this.matches) {
      // Use dedupKey if set by the provider, otherwise normalize the destination URL
      const key = match.dedupKey ?? normalizeUrlForDedup(match.destinationUrl);
      const existing = uniqueMatches.get(key);

      if (!existing) {
        uniqueMatches.set(key, match);
      } else {
        // Merge properties from the duplicate into the winner
        this.mergeMatches(existing, match);
      }
    }
    this.matches = Array.from(uniqueMatches.values());
  }

  /**
   * Merge properties from a duplicate match into the winning (higher relevance) match.
   * Per design doc section 8.2:
   *   - If one is a bookmark match and the other is history, mark as bookmarked
   *   - If one is a shortcut, preserve shortcut confidence
   *   - Always keep the higher relevance match as the base
   */
  private mergeMatches(winner: AutocompleteMatch, duplicate: AutocompleteMatch): void {
    // If either match is a bookmark, mark the winner as bookmarked
    if (duplicate.type === "bookmark" || winner.type === "bookmark") {
      if (winner.scoringSignals) {
        winner.scoringSignals.isBookmarked = true;
      }
    }

    // If the duplicate has inline completion and the winner doesn't, take it
    if (!winner.inlineCompletion && duplicate.inlineCompletion) {
      winner.inlineCompletion = duplicate.inlineCompletion;
    }

    // If the duplicate is allowed to be default and the winner isn't, inherit it
    if (duplicate.allowedToBeDefault && !winner.allowedToBeDefault) {
      winner.allowedToBeDefault = true;
    }

    // Prefer the richer description
    if (!winner.description && duplicate.description) {
      winner.description = duplicate.description;
    }
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
