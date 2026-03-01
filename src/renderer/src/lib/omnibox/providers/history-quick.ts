/**
 * HistoryQuickProvider (HQP)
 *
 * Fast in-memory tokenized matching against significant history.
 * Uses the InMemoryURLIndex for sub-20ms response times.
 *
 * Per design doc section 10.1:
 *   - Data source: InMemoryURLIndex (renderer-side)
 *   - Latency target: < 20ms
 *   - Max results: 3
 *   - Match types: "history-url"
 *
 * Scoring combines:
 *   - Frecency of the history entry (pre-computed in IMUI)
 *   - Match quality (host match > path match > title match; prefix > substring)
 *   - Inline completion eligibility (prefix matches get a bonus)
 *
 * This provider is SYNCHRONOUS — it returns results immediately from the
 * in-memory index, which is critical for:
 *   1. Setting the initial default match without async flicker
 *   2. Providing inline autocompletion candidates
 */

import { BaseProvider } from "@/lib/omnibox/base-provider";
import { InMemoryURLIndex, type IMUIEntry, type IMUIQueryResult } from "@/lib/omnibox/in-memory-url-index";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput, AutocompleteMatch } from "@/lib/omnibox/types";
import { findBestMatch } from "@/lib/omnibox/tokenizer";
import { normalizeUrlForDedup, stripSchemeAndWww } from "@/lib/omnibox/url-normalizer";

/** Maximum results returned by HQP. */
const MAX_RESULTS = 3;

/** Minimum relevance for inline completion eligibility (design doc 7.1). */
const INLINE_COMPLETION_THRESHOLD = 1200;

/** Maximum expected frecency for normalization. */
const MAX_EXPECTED_FRECENCY = 20;

/**
 * Score match quality by analyzing how input terms match a candidate's
 * URL and title tokens. Returns a score between 0 and 1.
 *
 * Scoring hierarchy (per design doc section 6.3):
 *   - Host match is most valuable (0.4 for prefix, 0.25 for substring)
 *   - Path match (0.15)
 *   - Title match (0.15 for word-boundary, 0.08 for substring)
 *   - Term coverage bonus (up to 0.2)
 */
function scoreMatchQuality(terms: string[], entry: IMUIEntry): number {
  let parsedHost = "";
  try {
    const parsed = new URL(entry.url);
    parsedHost = parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    parsedHost = entry.url.toLowerCase();
  }

  // Tokenize host and path separately for positional scoring
  const hostTokens: string[] = [];
  const pathTokens: string[] = [];
  for (const token of entry.urlTokens) {
    if (parsedHost.includes(token)) {
      hostTokens.push(token);
    } else {
      pathTokens.push(token);
    }
  }

  let score = 0;

  for (const term of terms) {
    // 1. Host match (most valuable)
    const hostMatch = findBestMatch(term, hostTokens);
    if (hostMatch === "exact" || hostMatch === "prefix") {
      score += 0.4;
    } else if (hostMatch === "substring") {
      score += 0.25;
    }

    // 2. Path match
    const pathMatch = findBestMatch(term, pathTokens);
    if (pathMatch !== "none") {
      score += 0.15;
    }

    // 3. Title match
    const titleMatch = findBestMatch(term, entry.titleTokens);
    if (titleMatch === "exact" || titleMatch === "prefix") {
      score += 0.15;
    } else if (titleMatch === "substring") {
      score += 0.08;
    }
  }

  // 4. Term coverage bonus
  const allTokens = [...entry.urlTokens, ...entry.titleTokens];
  const matchedTerms = terms.filter((t) => findBestMatch(t, allTokens) !== "none").length;
  const termCoverage = terms.length > 0 ? matchedTerms / terms.length : 0;
  score += termCoverage * 0.2;

  return Math.min(score, 1);
}

/**
 * Compute inline completion text if the input is a prefix of the URL.
 * Tries several normalizations (design doc section 7.2):
 *   1. Full URL
 *   2. URL without scheme
 *   3. URL without scheme + www
 */
function computeInlineCompletion(inputText: string, url: string): string | undefined {
  if (inputText.length < 2) return undefined;

  const inputLower = inputText.toLowerCase();
  const urlLower = url.toLowerCase();

  // Try matching with various prefix normalizations
  const variants = [
    urlLower, // exact
    urlLower.replace(/^https?:\/\//, ""), // without scheme
    urlLower.replace(/^https?:\/\/www\./, "") // without scheme+www
  ];

  for (const variant of variants) {
    if (variant.startsWith(inputLower)) {
      // Find the corresponding position in the original URL to get proper casing
      const matchIdx = url.toLowerCase().indexOf(inputLower);
      if (matchIdx >= 0) {
        const completionText = url.slice(matchIdx + inputText.length);
        if (completionText.length > 0) {
          return completionText;
        }
      } else {
        // Fallback for scheme-stripped variants
        const stripped = stripSchemeAndWww(url);
        if (stripped.toLowerCase().startsWith(inputLower)) {
          return stripped.slice(inputText.length);
        }
      }
    }
  }

  return undefined;
}

/**
 * Compute combined relevance within the history-url range (900-1400).
 * Per design doc section 6.4.
 */
function computeRelevance(
  frecency: number,
  matchQuality: number,
  inputLength: number,
  typedCount: number,
  hasInlineCompletion: boolean
): number {
  // Normalize frecency to 0..1
  const frecencyNorm = Math.min(Math.log1p(frecency) / Math.log1p(MAX_EXPECTED_FRECENCY), 1);

  // Input length weighting: longer input → more weight on match quality
  const inputLen = Math.min(Math.max(inputLength, 1), 30);
  const frecencyWeight = Math.max(0.3, 0.7 - inputLen * 0.02);
  const matchWeight = 1.0 - frecencyWeight;

  // Combined score (0..1)
  const combined = frecencyNorm * frecencyWeight + matchQuality * matchWeight;

  // Map to history-url range (900-1400)
  let relevance = Math.round(900 + combined * 500);

  // Bonuses
  if (typedCount > 0) relevance += 20;
  if (hasInlineCompletion) relevance += 30; // Prefix matches are higher quality

  // Cap within range
  return Math.min(relevance, 1400);
}

export class HistoryQuickProvider extends BaseProvider {
  name = "HistoryQuickProvider";

  /** Shared IMUI instance — injected from Omnibox. */
  private imui: InMemoryURLIndex;

  constructor(imui: InMemoryURLIndex) {
    super();
    this.imui = imui;
  }

  /**
   * Start is SYNCHRONOUS for HQP — results come from the in-memory index.
   * The callback is invoked immediately (not via setTimeout/Promise).
   */
  start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    const inputText = input.text;
    if (!inputText || inputText.length < 1) {
      onResults([]);
      return;
    }

    const terms = input.terms;
    if (terms.length === 0) {
      onResults([]);
      return;
    }

    // Query the IMUI — this should be < 20ms
    const queryResults = this.imui.query(terms);

    if (queryResults.length === 0) {
      onResults([]);
      return;
    }

    // Score and rank candidates
    const scored: Array<{ result: IMUIQueryResult; relevance: number; inlineCompletion?: string }> = [];

    for (const result of queryResults) {
      const matchQuality = scoreMatchQuality(terms, result.entry);
      const inlineCompletion = input.preventInlineAutocomplete
        ? undefined
        : computeInlineCompletion(inputText, result.entry.url);

      const relevance = computeRelevance(
        result.entry.frecency,
        matchQuality,
        inputText.length,
        result.entry.typedCount,
        inlineCompletion !== undefined
      );

      scored.push({ result, relevance, inlineCompletion });
    }

    // Sort by relevance descending and take top N
    scored.sort((a, b) => b.relevance - a.relevance);
    const top = scored.slice(0, MAX_RESULTS);

    // Build AutocompleteMatch objects
    const matches: AutocompleteMatch[] = top.map(({ result, relevance, inlineCompletion }) => {
      const entry = result.entry;
      const matchQuality = scoreMatchQuality(terms, entry);

      // Determine host match for scoring signals
      let hostMatchAtWordBoundary = false;
      try {
        const host = new URL(entry.url).hostname.replace(/^www\./, "").toLowerCase();
        const hostTokens = entry.urlTokens.filter((t) => host.includes(t));
        hostMatchAtWordBoundary = terms.some((term) => {
          const match = findBestMatch(term, hostTokens);
          return match === "exact" || match === "prefix";
        });
      } catch {
        // URL parse failed
      }

      return {
        providerName: this.name,
        relevance,
        contents: entry.url,
        description: entry.title,
        destinationUrl: entry.url,
        type: "history-url" as const,
        inlineCompletion: relevance >= INLINE_COMPLETION_THRESHOLD ? inlineCompletion : undefined,
        isDefault: relevance > 1300,
        allowedToBeDefault: relevance >= INLINE_COMPLETION_THRESHOLD,
        dedupKey: normalizeUrlForDedup(entry.url),
        scoringSignals: {
          typedCount: entry.typedCount,
          visitCount: entry.visitCount,
          elapsedTimeSinceLastVisit: Date.now() - entry.lastVisitTime,
          frecency: entry.frecency,
          matchQualityScore: matchQuality,
          hostMatchAtWordBoundary,
          hasNonSchemeWwwMatch: matchQuality > 0,
          isHostOnly: false, // Could refine later
          isBookmarked: false, // No bookmark data yet (Phase 4)
          hasOpenTabMatch: false, // Could cross-ref with open tabs later
          urlLength: entry.url.length
        }
      };
    });

    // Deliver results synchronously
    onResults(matches);
  }

  stop(): void {
    // No async operations to cancel — HQP is synchronous
  }
}
