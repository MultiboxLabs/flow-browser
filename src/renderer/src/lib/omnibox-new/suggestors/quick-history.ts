import { getHistory } from "@/lib/omnibox/data-providers/history";
import { getUniqueKeyFromUrl, isValidUrl } from "../helpers";
import { createWebsiteSuggestion } from "../suggestions";
import type { OmniboxSuggestion } from "../types";
import type { BrowsingHistoryEntry } from "~/types/history";
import { cacheUrlTitle, getOmniboxCurrentProfileId } from "../states";

const QUICK_HISTORY_LIMIT = 3;
const ZERO_SUGGEST_HISTORY_LIMIT = 5;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

type NormalizedHistoryEntry = BrowsingHistoryEntry & {
  urlLower: string;
  titleLower: string;
  uniqueUrlKey: string;
  hostname: string;
  pathAndQuery: string;
  searchWords: string[];
};

type QuickHistoryCacheEntry = {
  profileId: string;
  entries: NormalizedHistoryEntry[];
  loadedAt: number;
  refreshPromise: Promise<void> | null;
};

type PrimeQuickHistoryCacheOptions = {
  force?: boolean;
};

const quickHistoryCache = new Map<string, QuickHistoryCacheEntry>();

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .filter(Boolean)
    )
  );
}

function normalizeHistoryEntry(entry: BrowsingHistoryEntry): NormalizedHistoryEntry {
  const urlLower = entry.url.toLowerCase();
  const titleLower = entry.title.toLowerCase();
  const uniqueUrlKey = getUniqueKeyFromUrl(entry.url).toLowerCase();
  const title = entry.title.trim();

  if (title) {
    cacheUrlTitle(entry.url, title);
  }

  let hostname = "";
  let pathAndQuery = "";

  try {
    const parsed = new URL(entry.url);
    hostname = parsed.hostname.toLowerCase();
    pathAndQuery = `${parsed.pathname}${parsed.search}${parsed.hash}`.toLowerCase();
  } catch {
    pathAndQuery = uniqueUrlKey;
  }

  const searchWords = Array.from(new Set([...tokenize(hostname), ...tokenize(titleLower)]));

  return {
    ...entry,
    urlLower,
    titleLower,
    uniqueUrlKey,
    hostname,
    pathAndQuery,
    searchWords
  };
}

function getQueryTokens(inputLower: string): string[] {
  const tokens = tokenize(inputLower);
  return tokens.length > 0 ? tokens : [inputLower].filter(Boolean);
}

function matchesAllTokens(entry: NormalizedHistoryEntry, tokens: string[]): boolean {
  return tokens.every((token) => entry.urlLower.includes(token) || entry.titleLower.includes(token));
}

function hostnameContainsAllTokens(entry: NormalizedHistoryEntry, tokens: string[]): boolean {
  return tokens.every((token) => entry.hostname.includes(token));
}

function hasUrlPrefixMatch(entry: NormalizedHistoryEntry, inputLower: string): boolean {
  const urlWithHostname = `${entry.hostname}${entry.pathAndQuery}`;
  return (
    entry.urlLower.startsWith(inputLower) ||
    entry.uniqueUrlKey.startsWith(inputLower) ||
    entry.hostname.startsWith(inputLower) ||
    urlWithHostname.startsWith(inputLower)
  );
}

function isUrlLikeInput(input: string): boolean {
  return isValidUrl(input) !== null || /[./:]/.test(input);
}

function getMatchTier(entry: NormalizedHistoryEntry, inputLower: string, tokens: string[]): number | null {
  const isStrongUrlPrefixMatch = hasUrlPrefixMatch(entry, inputLower);

  if (isStrongUrlPrefixMatch) {
    return 320;
  }

  const hasWordPrefixMatch =
    entry.titleLower.startsWith(inputLower) ||
    tokens.some((token) => entry.searchWords.some((word) => word.startsWith(token)));

  if (hasWordPrefixMatch) {
    return 260;
  }

  if (matchesAllTokens(entry, tokens)) {
    return 180;
  }

  return null;
}

function getRecencyBonus(lastVisitTime: number): number {
  const age = Date.now() - lastVisitTime;
  if (age <= ONE_DAY_MS) return 140;
  if (age <= SEVEN_DAYS_MS) return 100;
  if (age <= THIRTY_DAYS_MS) return 60;
  return 20;
}

function getZeroSuggestRecencyBonus(lastVisitTime: number): number {
  const age = Date.now() - lastVisitTime;
  if (age <= ONE_DAY_MS) return 210;
  if (age <= SEVEN_DAYS_MS) return 170;
  if (age <= THIRTY_DAYS_MS) return 115;
  return 35;
}

function getQuickHistoryRelevance(entry: NormalizedHistoryEntry, inputLower: string, tokens: string[]): number | null {
  if (!matchesAllTokens(entry, tokens)) {
    return null;
  }

  const matchTier = getMatchTier(entry, inputLower, tokens);
  if (matchTier === null) {
    return null;
  }

  const typedBonus = Math.min(entry.typedCount * 12, 180);
  const visitBonus = Math.min(entry.visitCount * 3, 120);
  const recencyBonus = getRecencyBonus(entry.lastVisitTime);
  const hostnamePrefixBonus = entry.hostname.startsWith(inputLower) ? 40 : 0;
  const titlePrefixBonus = entry.titleLower.startsWith(inputLower) ? 30 : 0;

  return Math.min(
    690,
    300 + matchTier + typedBonus + visitBonus + recencyBonus + hostnamePrefixBonus + titlePrefixBonus
  );
}

export function primeQuickHistoryCache(
  profileId: string | null | undefined,
  options: PrimeQuickHistoryCacheOptions = {}
): Promise<void> {
  if (!profileId) {
    return Promise.resolve();
  }

  const existing = quickHistoryCache.get(profileId);
  if (existing?.refreshPromise) {
    return existing.refreshPromise;
  }

  if (existing && !options.force) {
    return Promise.resolve();
  }

  const refreshPromise = getHistory()
    .then((history) => {
      const entries = history.map(normalizeHistoryEntry);
      quickHistoryCache.set(profileId, {
        profileId,
        entries,
        loadedAt: Date.now(),
        refreshPromise: null
      });
    })
    .catch((error: unknown) => {
      console.error("primeQuickHistoryCache: history lookup failed", error);
      const stale = quickHistoryCache.get(profileId);
      if (stale) {
        quickHistoryCache.set(profileId, {
          ...stale,
          refreshPromise: null
        });
      }
    });

  quickHistoryCache.set(profileId, {
    profileId,
    entries: existing?.entries ?? [],
    loadedAt: existing?.loadedAt ?? 0,
    refreshPromise
  });

  return refreshPromise;
}

export function getQuickHistorySuggestions(trimmedInput: string): OmniboxSuggestion[] {
  const profileId = getOmniboxCurrentProfileId();
  if (!profileId) {
    return [];
  }

  const cacheEntry = quickHistoryCache.get(profileId);
  if (!cacheEntry || cacheEntry.profileId !== profileId || cacheEntry.entries.length === 0) {
    return [];
  }

  const inputLower = trimmedInput.toLowerCase();
  const tokens = getQueryTokens(inputLower);
  const inputLooksLikeUrl = isUrlLikeInput(trimmedInput);

  return cacheEntry.entries
    .map((entry) => {
      if (inputLooksLikeUrl && !hasUrlPrefixMatch(entry, inputLower)) {
        return null;
      }

      const relevance = getQuickHistoryRelevance(entry, inputLower, tokens);
      if (relevance === null) {
        return null;
      }

      return {
        suggestion: createWebsiteSuggestion(entry.url, relevance, entry.title.trim() || null, "quick-history"),
        lastVisitTime: entry.lastVisitTime,
        typedCount: entry.typedCount,
        visitCount: entry.visitCount,
        hostnameTokenMatch: hostnameContainsAllTokens(entry, tokens),
        urlLength: entry.uniqueUrlKey.length
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null)
    .sort((left, right) => {
      if (left.hostnameTokenMatch !== right.hostnameTokenMatch) {
        return Number(right.hostnameTokenMatch) - Number(left.hostnameTokenMatch);
      }
      if (left.hostnameTokenMatch && right.hostnameTokenMatch && left.urlLength !== right.urlLength) {
        return left.urlLength - right.urlLength;
      }
      if (right.suggestion.relevance !== left.suggestion.relevance) {
        return right.suggestion.relevance - left.suggestion.relevance;
      }
      if (right.lastVisitTime !== left.lastVisitTime) {
        return right.lastVisitTime - left.lastVisitTime;
      }
      if (right.typedCount !== left.typedCount) {
        return right.typedCount - left.typedCount;
      }
      if (right.visitCount !== left.visitCount) {
        return right.visitCount - left.visitCount;
      }
      return left.suggestion.url.localeCompare(right.suggestion.url);
    })
    .slice(0, QUICK_HISTORY_LIMIT)
    .map((entry) => entry.suggestion);
}

function getQuickHistoryCacheEntries(): NormalizedHistoryEntry[] {
  const profileId = getOmniboxCurrentProfileId();
  if (!profileId) {
    return [];
  }

  const cacheEntry = quickHistoryCache.get(profileId);
  if (!cacheEntry || cacheEntry.profileId !== profileId || cacheEntry.entries.length === 0) {
    return [];
  }

  return cacheEntry.entries;
}

function getZeroSuggestHistoryRelevance(entry: NormalizedHistoryEntry): number {
  const typedBonus = Math.min(entry.typedCount * 18, 250);
  const visitBonus = Math.min(entry.visitCount * 4, 180);
  const recencyBonus = getZeroSuggestRecencyBonus(entry.lastVisitTime);

  return Math.min(760, 240 + typedBonus + visitBonus + recencyBonus);
}

export function getZeroSuggestHistorySuggestions(): OmniboxSuggestion[] {
  const entries = getQuickHistoryCacheEntries();
  if (entries.length === 0) {
    return [];
  }

  const dedupedEntries = new Map<string, NormalizedHistoryEntry>();

  for (const entry of entries) {
    const existing = dedupedEntries.get(entry.uniqueUrlKey);
    if (!existing) {
      dedupedEntries.set(entry.uniqueUrlKey, entry);
      continue;
    }

    const currentScore = getZeroSuggestHistoryRelevance(entry);
    const existingScore = getZeroSuggestHistoryRelevance(existing);
    if (currentScore > existingScore || (currentScore === existingScore && entry.lastVisitTime > existing.lastVisitTime)) {
      dedupedEntries.set(entry.uniqueUrlKey, entry);
    }
  }

  return Array.from(dedupedEntries.values())
    .map((entry) => ({
      suggestion: createWebsiteSuggestion(entry.url, getZeroSuggestHistoryRelevance(entry), entry.title.trim() || null, "zero-suggest-history"),
      lastVisitTime: entry.lastVisitTime,
      typedCount: entry.typedCount,
      visitCount: entry.visitCount
    }))
    .sort((left, right) => {
      if (right.suggestion.relevance !== left.suggestion.relevance) {
        return right.suggestion.relevance - left.suggestion.relevance;
      }
      if (right.lastVisitTime !== left.lastVisitTime) {
        return right.lastVisitTime - left.lastVisitTime;
      }
      if (right.typedCount !== left.typedCount) {
        return right.typedCount - left.typedCount;
      }
      if (right.visitCount !== left.visitCount) {
        return right.visitCount - left.visitCount;
      }
      return left.suggestion.url.localeCompare(right.suggestion.url);
    })
    .slice(0, ZERO_SUGGEST_HISTORY_LIMIT)
    .map((entry) => entry.suggestion);
}
