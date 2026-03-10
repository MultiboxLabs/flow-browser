import { BaseProvider } from "@/lib/omnibox/base-provider";
import { searchHistory, getSignificantHistory, type HistoryEntry } from "@/lib/omnibox/data-providers/history";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput, AutocompleteMatch, InputType } from "@/lib/omnibox/types";
import { getURLFromInput } from "@/lib/url";
import { tokenize, tokenizeInput, allTermsMatch, findBestMatch } from "@/lib/omnibox/tokenizer";
import { calculateFrecency } from "@/lib/omnibox/frecency";
import { normalizeUrlForDedup, stripSchemeAndWww } from "@/lib/omnibox/url-normalizer";

/**
 * Score match quality by analyzing how the input matches a candidate URL and title.
 * Returns a score between 0 and 1.
 */
function scoreMatchQuality(terms: string[], url: string, title: string): number {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();

  let parsedHost = "";
  let parsedPath = "";
  try {
    const parsed = new URL(url);
    parsedHost = parsed.hostname.replace(/^www\./, "").toLowerCase();
    parsedPath = (parsed.pathname + parsed.search).toLowerCase();
  } catch {
    parsedHost = urlLower;
  }

  const hostTokens = tokenize(parsedHost);
  const pathTokens = tokenize(parsedPath);
  const titleTokens = tokenize(titleLower);

  let score = 0;

  for (const term of terms) {
    // 1. Host match is most valuable
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
    const titleMatch = findBestMatch(term, titleTokens);
    if (titleMatch === "exact" || titleMatch === "prefix") {
      score += 0.15;
    } else if (titleMatch === "substring") {
      score += 0.08;
    }
  }

  // 4. Term coverage bonus
  const allTokens = [...hostTokens, ...pathTokens, ...titleTokens];
  const matchedTerms = terms.filter((t) => findBestMatch(t, allTokens) !== "none").length;
  const termCoverage = terms.length > 0 ? matchedTerms / terms.length : 0;
  score += termCoverage * 0.2;

  return Math.min(score, 1);
}

/**
 * Check if a URL prefix-matches the input (for inline autocompletion).
 */
function getInlineCompletion(inputText: string, url: string): string | undefined {
  const inputLower = inputText.toLowerCase();
  const stripped = stripSchemeAndWww(url).toLowerCase();

  if (stripped.startsWith(inputLower) && stripped.length > inputLower.length) {
    // Return the completion from the stripped URL
    const fullStripped = stripSchemeAndWww(url);
    return fullStripped.slice(inputLower.length);
  }

  return undefined;
}

export class HistoryURLProvider extends BaseProvider {
  name = "HistoryURLProvider";

  // Cache significant history for sync-like matching
  private significantHistory: HistoryEntry[] = [];
  private lastFetchTime: number = 0;
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private async ensureCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetchTime > HistoryURLProvider.CACHE_TTL || this.significantHistory.length === 0) {
      this.significantHistory = await getSignificantHistory();
      this.lastFetchTime = now;
    }
  }

  start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    const inputText = input.text;
    if (!inputText) {
      onResults([]);
      return;
    }

    const terms = input.terms.length > 0 ? input.terms : tokenizeInput(inputText);

    // --- Synchronous part: what-you-typed match ---
    if (input.inputType !== InputType.FORCED_QUERY) {
      const url = getURLFromInput(inputText);
      if (url) {
        const typedURLMatch: AutocompleteMatch = {
          providerName: this.name,
          relevance: input.inputType === InputType.URL ? 1200 : 1150,
          contents: inputText,
          description: "Open URL",
          destinationUrl: url,
          type: "url-what-you-typed",
          isDefault: true,
          allowedToBeDefault: true,
          dedupKey: normalizeUrlForDedup(url)
        };
        onResults([typedURLMatch], true); // Send immediately, more results coming
      }
    }

    // --- Async part: search cached significant history + DB fallback ---
    this.matchHistory(input, terms, onResults);
  }

  private async matchHistory(
    input: AutocompleteInput,
    terms: string[],
    onResults: OmniboxUpdateCallback
  ): Promise<void> {
    await this.ensureCache();

    const results: AutocompleteMatch[] = [];
    const inputText = input.text;

    // Match against significant history (cached, fast)
    for (const entry of this.significantHistory) {
      const urlTokens = tokenize(entry.url);
      const titleTokens = tokenize(entry.title);
      const allTokens = [...urlTokens, ...titleTokens];

      if (!allTermsMatch(terms, allTokens)) continue;

      // Score the match
      const matchQuality = scoreMatchQuality(terms, entry.url, entry.title);
      const frecency = calculateFrecency(entry.visitCount, entry.typedCount, entry.lastVisitTime, entry.lastVisitType);

      // Compute relevance within the history-url range (900-1400)
      const frecencyNorm = Math.min(Math.log1p(frecency) / Math.log1p(20), 1);
      const inputLen = Math.min(Math.max(inputText.length, 1), 30);
      const frecencyWeight = Math.max(0.3, 0.7 - inputLen * 0.02);
      const matchWeight = 1.0 - frecencyWeight;
      const combined = frecencyNorm * frecencyWeight + matchQuality * matchWeight;
      let relevance = Math.round(900 + combined * 500);

      // Bonus for typed URLs
      if (entry.typedCount > 0) relevance += 20;

      // Cap within range
      relevance = Math.min(relevance, 1400);

      const inlineCompletion = getInlineCompletion(inputText, entry.url);

      results.push({
        providerName: this.name,
        relevance,
        contents: entry.url,
        description: entry.title,
        destinationUrl: entry.url,
        type: "history-url",
        inlineCompletion,
        isDefault: relevance > 1300,
        allowedToBeDefault: relevance > 1200,
        dedupKey: normalizeUrlForDedup(entry.url),
        scoringSignals: {
          typedCount: entry.typedCount,
          visitCount: entry.visitCount,
          elapsedTimeSinceLastVisit: Date.now() - entry.lastVisitTime,
          frecency,
          matchQualityScore: matchQuality,
          hostMatchAtWordBoundary: matchQuality >= 0.4,
          hasNonSchemeWwwMatch: matchQuality > 0,
          isHostOnly: false,
          isBookmarked: false,
          hasOpenTabMatch: false,
          urlLength: entry.url.length
        }
      });
    }

    // Sort by relevance and take top results
    results.sort((a, b) => b.relevance - a.relevance);

    // If we got few results from cache, also search the DB
    if (results.length < 5 && inputText.length >= 2) {
      try {
        const dbResults = await searchHistory(inputText, 20);
        for (const entry of dbResults) {
          // Skip if already in results (by URL)
          if (results.some((r) => r.destinationUrl === entry.url)) continue;

          const urlTokens = tokenize(entry.url);
          const titleTokens = tokenize(entry.title);
          const allTokens = [...urlTokens, ...titleTokens];

          if (!allTermsMatch(terms, allTokens)) continue;

          const matchQuality = scoreMatchQuality(terms, entry.url, entry.title);
          const frecency = calculateFrecency(
            entry.visitCount,
            entry.typedCount,
            entry.lastVisitTime,
            entry.lastVisitType
          );

          const frecencyNorm = Math.min(Math.log1p(frecency) / Math.log1p(20), 1);
          const combined = frecencyNorm * 0.5 + matchQuality * 0.5;
          const relevance = Math.min(Math.round(900 + combined * 400), 1300);

          results.push({
            providerName: this.name,
            relevance,
            contents: entry.url,
            description: entry.title,
            destinationUrl: entry.url,
            type: "history-url",
            inlineCompletion: getInlineCompletion(inputText, entry.url),
            dedupKey: normalizeUrlForDedup(entry.url),
            scoringSignals: {
              typedCount: entry.typedCount,
              visitCount: entry.visitCount,
              elapsedTimeSinceLastVisit: Date.now() - entry.lastVisitTime,
              frecency,
              matchQualityScore: matchQuality,
              hostMatchAtWordBoundary: false,
              hasNonSchemeWwwMatch: matchQuality > 0,
              isHostOnly: false,
              isBookmarked: false,
              hasOpenTabMatch: false,
              urlLength: entry.url.length
            }
          });
        }

        results.sort((a, b) => b.relevance - a.relevance);
      } catch {
        // DB search failed, continue with cached results
      }
    }

    onResults(results.slice(0, 5));
  }

  stop(): void {
    // No ongoing operations to stop
  }
}
