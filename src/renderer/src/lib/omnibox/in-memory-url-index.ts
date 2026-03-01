/**
 * In-Memory URL Index (IMUI)
 *
 * Maintains a pre-built, tokenized index of "significant" history entries
 * entirely in memory on the renderer side. Enables HistoryQuickProvider
 * to return matches in under 20ms.
 *
 * Structure (per design doc section 4.2):
 *   - entries: Map<historyId, IMUIEntry>  — primary data
 *   - wordToIds: Map<word, Set<historyId>>  — inverted index
 *   - prefixToWords: Map<prefix, Set<word>>  — 2-3 char prefix lookup
 *
 * Population: loads significant history from main process via IPC on init,
 * then refreshes incrementally on new visits or periodically.
 */

import { tokenize } from "@/lib/omnibox/tokenizer";
import { calculateFrecency } from "@/lib/omnibox/frecency";
import { getSignificantHistory, type HistoryEntry } from "@/lib/omnibox/data-providers/history";

/** An entry stored in the IMUI with pre-computed tokens and frecency. */
export interface IMUIEntry {
  historyId: number;
  url: string;
  title: string;
  visitCount: number;
  typedCount: number;
  lastVisitTime: number;
  lastVisitType: number;
  firstVisitTime: number;
  /** Pre-computed frecency score (refreshed on load/update). */
  frecency: number;
  /** Tokenized URL parts (lowercased). */
  urlTokens: string[];
  /** Tokenized title words (lowercased). */
  titleTokens: string[];
}

/** Result from an IMUI query before final scoring by HQP. */
export interface IMUIQueryResult {
  entry: IMUIEntry;
  /** Which tokens in the URL matched each input term. */
  urlTermMatches: number;
  /** Which tokens in the title matched each input term. */
  titleTermMatches: number;
}

/**
 * The In-Memory URL Index.
 *
 * Provides sub-20ms tokenized lookups over significant browsing history.
 */
export class InMemoryURLIndex {
  /** Primary data: historyId → IMUIEntry */
  private entries: Map<number, IMUIEntry> = new Map();

  /** Inverted index: word → set of historyIds containing that word */
  private wordToIds: Map<string, Set<number>> = new Map();

  /**
   * Prefix index: 2-char prefix → set of words starting with that prefix.
   * Used for fast prefix matching of input terms against indexed words.
   */
  private prefixToWords: Map<string, Set<string>> = new Map();

  /** Whether the index has been populated at least once. */
  private _populated: boolean = false;

  /** Timestamp of last full refresh. */
  private lastRefreshTime: number = 0;

  /** Minimum interval between full refreshes (5 minutes). */
  private static REFRESH_INTERVAL = 5 * 60 * 1000;

  /** Maximum entries to prevent unbounded memory growth. */
  private static MAX_ENTRIES = 2000;

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  get populated(): boolean {
    return this._populated;
  }

  get size(): number {
    return this.entries.size;
  }

  /**
   * Populate the index from the main process history DB.
   * Should be called once on omnibox initialization; further calls
   * are throttled to REFRESH_INTERVAL.
   */
  async populate(): Promise<void> {
    const now = Date.now();
    if (this._populated && now - this.lastRefreshTime < InMemoryURLIndex.REFRESH_INTERVAL) {
      return; // Too soon for a refresh
    }

    try {
      const entries = await getSignificantHistory();
      this.rebuild(entries);
      this.lastRefreshTime = now;
      this._populated = true;
      console.log(`[IMUI] Populated with ${this.entries.size} entries, ${this.wordToIds.size} unique words`);
    } catch (err) {
      console.error("[IMUI] Failed to populate:", err);
    }
  }

  /**
   * Force a full refresh regardless of the throttle interval.
   */
  async forceRefresh(): Promise<void> {
    this.lastRefreshTime = 0;
    await this.populate();
  }

  /**
   * Add or update a single entry incrementally (e.g., after a new visit).
   */
  addOrUpdate(entry: HistoryEntry): void {
    const existing = this.entries.get(entry.id);

    if (existing) {
      // Remove old tokens from inverted indexes before re-indexing
      this.removeFromIndexes(existing);
    }

    const imuiEntry = this.buildEntry(entry);
    this.entries.set(entry.id, imuiEntry);
    this.addToIndexes(imuiEntry);
  }

  /**
   * Query the index with tokenized input terms.
   * Implements the algorithm from design doc section 4.4:
   *   1. For each term, find matching words (prefix + substring)
   *   2. Collect IDs for those words
   *   3. Intersect across all terms
   *   4. Return candidate entries with match metadata
   *
   * @param terms Pre-tokenized, lowercased input terms
   * @param maxCandidates Safety limit — if too many matches, return empty (input too short)
   * @returns Array of query results (unscored — scoring is HQP's job)
   */
  query(terms: string[], maxCandidates: number = 500): IMUIQueryResult[] {
    if (terms.length === 0 || !this._populated) return [];

    let resultIds: Set<number> | null = null;

    for (const term of terms) {
      const termIds = this.getIdsForTerm(term);

      if (resultIds === null) {
        resultIds = new Set(termIds);
      } else {
        // Intersect: keep only IDs present in both sets
        const intersected = new Set<number>();
        for (const id of resultIds) {
          if (termIds.has(id)) intersected.add(id);
        }
        resultIds = intersected;
      }

      // Early termination if intersection is empty
      if (resultIds.size === 0) return [];
    }

    if (!resultIds || resultIds.size === 0) return [];

    // Safety: if too many candidates, the input is too vague
    if (resultIds.size > maxCandidates) return [];

    // Build results with match metadata
    const results: IMUIQueryResult[] = [];
    for (const id of resultIds) {
      const entry = this.entries.get(id);
      if (!entry) continue;

      let urlTermMatches = 0;
      let titleTermMatches = 0;

      for (const term of terms) {
        if (this.termMatchesTokens(term, entry.urlTokens)) urlTermMatches++;
        if (this.termMatchesTokens(term, entry.titleTokens)) titleTermMatches++;
      }

      results.push({ entry, urlTermMatches, titleTermMatches });
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // Index building
  // ---------------------------------------------------------------------------

  /**
   * Rebuild the entire index from a list of history entries.
   */
  private rebuild(entries: HistoryEntry[]): void {
    this.entries.clear();
    this.wordToIds.clear();
    this.prefixToWords.clear();

    // Take the most significant entries up to the cap
    const capped = entries.slice(0, InMemoryURLIndex.MAX_ENTRIES);

    for (const entry of capped) {
      const imuiEntry = this.buildEntry(entry);
      this.entries.set(entry.id, imuiEntry);
      this.addToIndexes(imuiEntry);
    }
  }

  /**
   * Convert a HistoryEntry from the DB into an IMUIEntry with pre-computed fields.
   */
  private buildEntry(entry: HistoryEntry): IMUIEntry {
    const urlTokens = tokenize(entry.url);
    const titleTokens = tokenize(entry.title);
    const frecency = calculateFrecency(entry.visitCount, entry.typedCount, entry.lastVisitTime, entry.lastVisitType);

    return {
      historyId: entry.id,
      url: entry.url,
      title: entry.title,
      visitCount: entry.visitCount,
      typedCount: entry.typedCount,
      lastVisitTime: entry.lastVisitTime,
      lastVisitType: entry.lastVisitType,
      firstVisitTime: entry.firstVisitTime,
      frecency,
      urlTokens,
      titleTokens
    };
  }

  /**
   * Add an entry's tokens to the inverted indexes.
   */
  private addToIndexes(entry: IMUIEntry): void {
    const allTokens = new Set([...entry.urlTokens, ...entry.titleTokens]);

    for (const token of allTokens) {
      // wordToIds: token → set of entry IDs
      let idSet = this.wordToIds.get(token);
      if (!idSet) {
        idSet = new Set();
        this.wordToIds.set(token, idSet);
      }
      idSet.add(entry.historyId);

      // prefixToWords: 2-char prefix → set of words
      if (token.length >= 2) {
        const prefix = token.slice(0, 2);
        let wordSet = this.prefixToWords.get(prefix);
        if (!wordSet) {
          wordSet = new Set();
          this.prefixToWords.set(prefix, wordSet);
        }
        wordSet.add(token);
      }
    }
  }

  /**
   * Remove an entry's tokens from the inverted indexes.
   */
  private removeFromIndexes(entry: IMUIEntry): void {
    const allTokens = new Set([...entry.urlTokens, ...entry.titleTokens]);

    for (const token of allTokens) {
      const idSet = this.wordToIds.get(token);
      if (idSet) {
        idSet.delete(entry.historyId);
        if (idSet.size === 0) {
          this.wordToIds.delete(token);
          // Also clean up prefix index
          if (token.length >= 2) {
            const prefix = token.slice(0, 2);
            const wordSet = this.prefixToWords.get(prefix);
            if (wordSet) {
              wordSet.delete(token);
              if (wordSet.size === 0) this.prefixToWords.delete(prefix);
            }
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Term matching (used during query)
  // ---------------------------------------------------------------------------

  /**
   * Get all history IDs matching a single input term.
   * Uses the priority cascade from design doc section 4.4:
   *   1. Exact word match
   *   2. Prefix match via prefixToWords
   *   3. Substring match via character intersection
   */
  private getIdsForTerm(term: string): Set<number> {
    const ids = new Set<number>();

    // 1. Exact word match — highest confidence
    const exactIds = this.wordToIds.get(term);
    if (exactIds) {
      for (const id of exactIds) ids.add(id);
    }

    // 2. Prefix match — find words starting with this term
    if (term.length >= 2) {
      const prefix = term.slice(0, 2);
      const candidateWords = this.prefixToWords.get(prefix);
      if (candidateWords) {
        for (const word of candidateWords) {
          if (word !== term && word.startsWith(term)) {
            const wordIds = this.wordToIds.get(word);
            if (wordIds) {
              for (const id of wordIds) ids.add(id);
            }
          }
        }
      }
    }

    // 3. Substring match — find words containing this term
    // Only if we haven't found enough matches via prefix, and term is long enough
    // to be discriminating (>= 3 chars to avoid too many false positives)
    if (ids.size < 10 && term.length >= 3) {
      for (const [word, wordIds] of this.wordToIds) {
        if (word !== term && !word.startsWith(term) && word.includes(term)) {
          for (const id of wordIds) ids.add(id);
        }
      }
    }

    return ids;
  }

  /**
   * Check if a term matches any token in a token list (for match metadata).
   */
  private termMatchesTokens(term: string, tokens: string[]): boolean {
    for (const token of tokens) {
      if (token === term || token.startsWith(term) || token.includes(term)) {
        return true;
      }
    }
    return false;
  }
}
