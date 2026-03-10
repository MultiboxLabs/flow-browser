/**
 * ShortcutsProvider
 *
 * Matches against learned input-to-destination shortcuts from user behavior.
 * When the user types "gi" and selects "github.com", that mapping is recorded.
 * On future "gi" inputs, this provider offers "github.com" with high confidence.
 *
 * Per design doc section 10.5:
 *   - Data source: Shortcuts SQLite table (via IPC)
 *   - Latency: Async but fast
 *   - Max results: 3
 *   - Match types: "shortcut"
 *   - Scoring range: 1000-1450 (second highest max, behind only open-tab)
 *
 * Shortcuts use a 7-day half-life decay (shorter than history's 30 days)
 * because shortcut relevance is more ephemeral — it reflects recent habits.
 */

import { BaseProvider } from "@/lib/omnibox/base-provider";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput, AutocompleteMatch } from "@/lib/omnibox/types";
import { searchShortcuts, type OmniboxShortcutEntry } from "@/lib/omnibox/data-providers/shortcuts";
import { normalizeUrlForDedup } from "@/lib/omnibox/url-normalizer";

/** Maximum results returned by ShortcutsProvider. */
const MAX_RESULTS = 3;

/** Scoring range per design doc section 6.4 */
const RANGE_MIN = 1000;
const RANGE_MAX = 1450;

/** Half-life for shortcut decay in days (design doc: 7 days). */
const HALF_LIFE_DAYS = 7;

/** Minimum relevance for inline completion eligibility (design doc 7.1). */
const INLINE_COMPLETION_THRESHOLD = 1200;

/**
 * Compute a decayed relevance score for a shortcut entry.
 *
 * Factors:
 *   1. Hit count (log-scaled to prevent dominance)
 *   2. Recency (7-day half-life exponential decay)
 *   3. Input specificity (shorter stored input matching current input = higher confidence)
 */
function computeShortcutRelevance(entry: OmniboxShortcutEntry, currentInputLength: number): number {
  const now = Date.now();
  const elapsed = now - entry.lastAccessTime;

  // Exponential decay with 7-day half-life
  const lambda = Math.LN2 / (HALF_LIFE_DAYS * 86400000);
  const decay = Math.exp(-lambda * elapsed);

  // Hit count contribution (sublinear — log scale)
  const hitScore = Math.log1p(entry.hitCount);

  // Input specificity bonus: if the stored input exactly matches or is very
  // close to the current input, it's a stronger signal
  const inputLenRatio = Math.min(entry.inputText.length / Math.max(currentInputLength, 1), 1);
  const specificityBonus = inputLenRatio * 0.3;

  // Combined score normalized to 0..1
  const maxExpectedHitScore = Math.log1p(50); // ~3.93 for 50 hits
  const normalized = Math.min((decay * hitScore) / maxExpectedHitScore + specificityBonus, 1);

  // Map to shortcut range (1000-1450)
  return Math.round(RANGE_MIN + normalized * (RANGE_MAX - RANGE_MIN));
}

/**
 * Compute inline completion text if the input is a prefix of the destination URL.
 */
function computeInlineCompletion(inputText: string, url: string): string | undefined {
  if (inputText.length < 2) return undefined;

  const inputLower = inputText.toLowerCase();
  const urlLower = url.toLowerCase();

  // Try matching with various prefix normalizations
  const variants = [urlLower, urlLower.replace(/^https?:\/\//, ""), urlLower.replace(/^https?:\/\/www\./, "")];

  for (const variant of variants) {
    if (variant.startsWith(inputLower)) {
      const stripped = url.replace(/^https?:\/\/(www\.)?/, "");
      if (stripped.toLowerCase().startsWith(inputLower)) {
        return stripped.slice(inputText.length);
      }
      // Fallback: find position in original URL
      const idx = url.toLowerCase().indexOf(inputLower);
      if (idx >= 0) {
        const completionText = url.slice(idx + inputText.length);
        if (completionText.length > 0) return completionText;
      }
    }
  }

  return undefined;
}

export class ShortcutsProvider extends BaseProvider {
  name = "ShortcutsProvider";

  private abortController: AbortController | null = null;

  start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    const inputText = input.text.trim();
    if (!inputText) {
      onResults([]);
      return;
    }

    // Cancel any in-flight request
    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Async IPC call to search shortcuts
    searchShortcuts(inputText, MAX_RESULTS * 2).then((entries) => {
      if (signal.aborted) return;

      if (entries.length === 0) {
        onResults([]);
        return;
      }

      // Score and rank
      const scored = entries.map((entry) => ({
        entry,
        relevance: computeShortcutRelevance(entry, inputText.length)
      }));

      scored.sort((a, b) => b.relevance - a.relevance);
      const top = scored.slice(0, MAX_RESULTS);

      // Build matches
      const matches: AutocompleteMatch[] = top.map(({ entry, relevance }) => {
        const inlineCompletion = input.preventInlineAutocomplete
          ? undefined
          : computeInlineCompletion(inputText, entry.destinationUrl);

        return {
          providerName: this.name,
          relevance,
          contents: entry.destinationTitle || entry.destinationUrl,
          description: entry.destinationUrl,
          destinationUrl: entry.destinationUrl,
          type: "shortcut" as const,
          inlineCompletion: relevance >= INLINE_COMPLETION_THRESHOLD ? inlineCompletion : undefined,
          allowedToBeDefault: relevance >= INLINE_COMPLETION_THRESHOLD,
          dedupKey: normalizeUrlForDedup(entry.destinationUrl),
          scoringSignals: {
            typedCount: 0,
            visitCount: entry.hitCount,
            elapsedTimeSinceLastVisit: Date.now() - entry.lastAccessTime,
            frecency: 0,
            matchQualityScore: 1, // Exact match by definition
            hostMatchAtWordBoundary: true,
            hasNonSchemeWwwMatch: true,
            isHostOnly: false,
            isBookmarked: false, // TODO: Cross-ref with bookmarks when available
            hasOpenTabMatch: false,
            urlLength: entry.destinationUrl.length
          }
        };
      });

      onResults(matches);
    });
  }

  stop(): void {
    this.abortController?.abort();
    this.abortController = null;
  }
}
