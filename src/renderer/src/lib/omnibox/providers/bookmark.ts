/**
 * BookmarkProvider — STUB (Phase 4)
 *
 * TODO: The bookmarks system is not yet implemented in the app.
 * When a bookmarks service is available, this provider should:
 *
 * Per design doc section 10.4:
 *   - Data source: Bookmarks SQLite table (via IPC, cached in renderer)
 *   - Latency target: < 10ms (cached)
 *   - Max results: 3
 *   - Match types: "bookmark"
 *   - Scoring range: 900-1350
 *   - Sync provider (eligible for inline completion)
 *
 * Implementation plan:
 *   1. Maintain an in-memory cache of all bookmarks (refreshed periodically)
 *   2. On `start()`, tokenize input and match against bookmark URL + title tokens
 *   3. Score using match quality + bookmark age/position
 *   4. Return up to 3 bookmark matches
 *   5. Provide inline completion for high-confidence prefix matches
 *   6. Set `isBookmarked: true` in scoringSignals for all bookmark matches
 *
 * Matching logic should mirror HistoryQuickProvider's tokenized matching:
 *   - Host match is most valuable
 *   - Path match
 *   - Title match (word-boundary > substring)
 *   - Term coverage bonus
 *
 * Cross-provider integration:
 *   - Export a fast `isUrlBookmarked(url)` check that other providers
 *     (HQP, HUP, SearchProvider) can call to set the `isBookmarked` signal
 *   - isBookmarked URLs get a +30 relevance bonus across all providers
 *     (design doc section 6.4)
 */

import { BaseProvider } from "@/lib/omnibox/base-provider";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput } from "@/lib/omnibox/types";

export class BookmarkProvider extends BaseProvider {
  name = "BookmarkProvider";

  /**
   * TODO: Implement when bookmarks system is available.
   *
   * Should be SYNCHRONOUS (like HQP) — matching against an in-memory
   * cache of bookmarks. This is critical for:
   *   1. Setting the initial default match without async flicker
   *   2. Providing inline autocompletion candidates
   *
   * Steps:
   *   1. Check if cache needs refresh (populate on construction, refresh every 5min)
   *   2. Tokenize input terms
   *   3. Search in-memory bookmark index
   *   4. Score matches within 900-1350 range
   *   5. Compute inline completion for prefix matches
   *   6. Return top 3 results
   */
  start(_input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    // No bookmarks system yet — return empty results
    onResults([]);
  }

  stop(): void {
    // No async operations to cancel — BookmarkProvider should be synchronous
  }
}
