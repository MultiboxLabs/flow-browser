/**
 * Centralized scoring engine for the omnibox.
 *
 * Implements the combined relevance computation from design doc section 6.4,
 * match quality scoring from section 6.3, and provides a unified API
 * for all providers to compute final relevance scores.
 */

import { AutocompleteMatch, InputType, ScoringSignals } from "@/lib/omnibox/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum expected frecency score, used for normalization. */
const MAX_EXPECTED_FRECENCY = 50;

/** Provider base relevance ranges (Chromium-inspired). */
const BASE_RANGES: Record<string, { min: number; max: number }> = {
  "url-what-you-typed": { min: 1150, max: 1200 },
  "history-url": { min: 900, max: 1400 },
  "open-tab": { min: 1100, max: 1500 },
  "search-query": { min: 300, max: 1000 },
  verbatim: { min: 1250, max: 1300 },
  "zero-suggest": { min: 300, max: 800 },
  pedal: { min: 1100, max: 1200 },
  bookmark: { min: 900, max: 1350 },
  shortcut: { min: 1000, max: 1450 },
  navsuggest: { min: 900, max: 1300 }
};

// ---------------------------------------------------------------------------
// Match Quality Scoring (design doc section 6.3)
// ---------------------------------------------------------------------------

/**
 * Score the quality of how the input matches a candidate URL/title.
 *
 * @param terms Pre-tokenized, lowercased input terms
 * @param url The candidate URL
 * @param title The candidate title
 * @returns A score between 0 and 1
 */
export function scoreMatchQuality(terms: string[], url: string, title: string): number {
  if (terms.length === 0) return 0;

  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();

  let host: string;
  let path: string;
  try {
    const parsed = new URL(url);
    host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    path = (parsed.pathname + parsed.search).toLowerCase();
  } catch {
    host = urlLower;
    path = "";
  }

  let score = 0;

  // 1. Host match (most valuable)
  for (const term of terms) {
    if (host.startsWith(term)) {
      score += 0.4; // Host prefix match — very strong
    } else if (host.includes(term)) {
      score += 0.25; // Host substring match
    }
  }

  // 2. URL path match
  for (const term of terms) {
    if (path.includes(term)) {
      score += 0.15;
    }
  }

  // 3. Title match
  for (const term of terms) {
    const titleWords = titleLower.split(/\s+/);
    if (titleWords.some((w) => w.startsWith(term))) {
      score += 0.15; // Title word-boundary match
    } else if (titleLower.includes(term)) {
      score += 0.08; // Title substring match
    }
  }

  // 4. Term coverage bonus
  const urlTermMatches = terms.filter((t) => urlLower.includes(t)).length;
  const titleTermMatches = terms.filter((t) => titleLower.includes(t)).length;
  const termCoverage = Math.max(urlTermMatches, titleTermMatches) / terms.length;
  score += termCoverage * 0.2;

  return clamp(score, 0, 1);
}

// ---------------------------------------------------------------------------
// Combined Relevance Computation (design doc section 6.4)
// ---------------------------------------------------------------------------

/**
 * Compute final relevance for a match using all available scoring signals.
 *
 * @param match The autocomplete match
 * @param signals Scoring signals for the match
 * @param inputType The classified input type
 * @param inputLength Length of the user's input text
 * @returns Final relevance score
 */
export function computeRelevance(
  match: AutocompleteMatch,
  signals: ScoringSignals,
  inputType: InputType,
  inputLength: number
): number {
  const range = BASE_RANGES[match.type] ?? { min: 0, max: 1000 };

  // Frecency component (0..1)
  const frecencyNorm = clamp(Math.log1p(signals.frecency) / Math.log1p(MAX_EXPECTED_FRECENCY), 0, 1);

  // Match quality component (0..1) — from scoreMatchQuality
  const matchQuality = signals.matchQualityScore;

  // Input length weighting: longer input → more weight on match quality
  const inputLen = clamp(inputLength, 1, 30);
  const frecencyWeight = Math.max(0.3, 0.7 - inputLen * 0.02);
  const matchWeight = 1.0 - frecencyWeight;

  // Combined score (0..1)
  const combined = frecencyNorm * frecencyWeight + matchQuality * matchWeight;

  // Map to provider's range
  let relevance = range.min + combined * (range.max - range.min);

  // Bonuses
  if (signals.isBookmarked) relevance += 30;
  if (signals.hasOpenTabMatch) relevance += 50;
  if (signals.hostMatchAtWordBoundary) relevance += 20;
  if (signals.isHostOnly && inputType === InputType.URL) relevance += 40;

  // Penalties
  if (!signals.hasNonSchemeWwwMatch) relevance -= 50; // Only matched scheme/www
  if (signals.urlLength > 200) relevance -= 20; // Very long URLs

  // Clamp to the provider's range (with bonus headroom)
  return Math.round(clamp(relevance, range.min, range.max + 100));
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
