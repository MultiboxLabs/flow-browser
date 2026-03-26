import { generateTitleFromUrl, isValidUrl } from "../helpers";
import { getOmniboxCurrentSpaceId } from "../states";
import type { OpenTabSuggestion } from "../types";
import type { TabData, WindowTabsData } from "~/types/tabs";
import { stringSimilarity } from "string-similarity-js";

const OPEN_TAB_LIMIT = 3;
const MIN_QUERY_LENGTH = 3;
const MIN_SIMILARITY = 0.35;
const OPEN_TAB_MIN_RELEVANCE = 550;
const OPEN_TAB_MAX_RELEVANCE = 650;
const ZERO_SUGGEST_OPEN_TAB_LIMIT = 3;
const ZERO_SUGGEST_OPEN_TAB_MAX_RELEVANCE = 840;
const ZERO_SUGGEST_OPEN_TAB_MIN_RELEVANCE = 780;

type NormalizedOpenTab = TabData & {
  titleLower: string;
  urlLower: string;
  displayUrlLower: string;
  hostname: string;
  normalizedHostname: string;
};

type OpenTabsCacheEntry = {
  tabs: TabData[];
  focusedTabIds: WindowTabsData["focusedTabIds"];
  loadedAt: number;
  refreshPromise: Promise<void> | null;
};

type PrimeOpenTabsCacheOptions = {
  force?: boolean;
};

const openTabsCache = new Map<string, OpenTabsCacheEntry>();

function normalizeOpenTab(tab: TabData): NormalizedOpenTab {
  const title = tab.title.trim();
  const titleLower = title.toLowerCase();
  const urlLower = tab.url.trim().toLowerCase();
  const displayUrlLower = generateTitleFromUrl(tab.url).toLowerCase();
  let hostname = "";

  try {
    const parsed = new URL(tab.url);
    hostname = parsed.hostname.toLowerCase();
  } catch {
    hostname = "";
  }

  return {
    ...tab,
    titleLower,
    urlLower,
    displayUrlLower,
    hostname,
    normalizedHostname: hostname.replace(/^www\./, "")
  };
}

function isUrlLikeInput(input: string): boolean {
  return isValidUrl(input) !== null || /[./:]/.test(input);
}

function hasUrlPrefixMatch(tab: NormalizedOpenTab, inputLower: string): boolean {
  return (
    tab.urlLower.startsWith(inputLower) ||
    tab.displayUrlLower.startsWith(inputLower) ||
    tab.hostname.startsWith(inputLower) ||
    tab.normalizedHostname.startsWith(inputLower)
  );
}

function getOpenTabSimilarity(tab: NormalizedOpenTab, inputLower: string): number {
  const titleSimilarity = stringSimilarity(inputLower, tab.titleLower, undefined, false);
  const urlSimilarity = stringSimilarity(inputLower, tab.urlLower, undefined, false);
  const displayUrlSimilarity = stringSimilarity(inputLower, tab.displayUrlLower, undefined, false);
  const hostnameSimilarity = stringSimilarity(inputLower, tab.normalizedHostname, undefined, false);
  return Math.max(titleSimilarity, urlSimilarity, displayUrlSimilarity, hostnameSimilarity);
}

function getOpenTabRelevance(tab: NormalizedOpenTab, inputLower: string, inputLooksLikeUrl: boolean): number | null {
  const bestSimilarity = getOpenTabSimilarity(tab, inputLower);
  const hasSubstringMatch =
    tab.titleLower.includes(inputLower) ||
    tab.urlLower.includes(inputLower) ||
    tab.displayUrlLower.includes(inputLower) ||
    tab.normalizedHostname.includes(inputLower);
  const hasStrongUrlPrefix = hasUrlPrefixMatch(tab, inputLower);

  if (inputLooksLikeUrl && !hasStrongUrlPrefix && bestSimilarity < MIN_SIMILARITY) {
    return null;
  }

  if (!hasSubstringMatch && bestSimilarity < MIN_SIMILARITY) {
    return null;
  }

  const relevance =
    OPEN_TAB_MIN_RELEVANCE + Math.round(bestSimilarity * (OPEN_TAB_MAX_RELEVANCE - OPEN_TAB_MIN_RELEVANCE));
  return Math.min(OPEN_TAB_MAX_RELEVANCE, Math.max(OPEN_TAB_MIN_RELEVANCE, relevance));
}

function createOpenTabSuggestion(tab: NormalizedOpenTab, relevance: number, isZeroSuggest: boolean): OpenTabSuggestion {
  return {
    type: "open-tab",
    tabId: tab.id,
    spaceId: tab.spaceId,
    title: tab.title.trim() || generateTitleFromUrl(tab.url),
    url: tab.url,
    relevance,
    source: isZeroSuggest ? "zero-suggest-open-tab" : "open-tab"
  };
}

function getEligibleOpenTabs(cacheEntry: OpenTabsCacheEntry, currentSpaceId: string): NormalizedOpenTab[] {
  const focusedTabId = cacheEntry.focusedTabIds[currentSpaceId] ?? null;

  return cacheEntry.tabs
    .filter((tab) => tab.spaceId === currentSpaceId && !tab.ephemeral && tab.id !== focusedTabId)
    .map(normalizeOpenTab);
}

export function primeOpenTabsCache(
  currentSpaceId: string | null | undefined,
  options: PrimeOpenTabsCacheOptions = {}
): Promise<void> {
  if (!currentSpaceId) {
    return Promise.resolve();
  }

  const existing = openTabsCache.get(currentSpaceId);
  if (existing?.refreshPromise) {
    return existing.refreshPromise;
  }

  if (existing && !options.force) {
    return Promise.resolve();
  }

  const refreshPromise = flow.tabs
    .getData()
    .then((tabsData) => {
      openTabsCache.set(currentSpaceId, {
        tabs: tabsData.tabs,
        focusedTabIds: tabsData.focusedTabIds,
        loadedAt: Date.now(),
        refreshPromise: null
      });
    })
    .catch((error: unknown) => {
      console.error("primeOpenTabsCache: tabs lookup failed", error);
      const stale = openTabsCache.get(currentSpaceId);
      if (stale) {
        openTabsCache.set(currentSpaceId, {
          ...stale,
          refreshPromise: null
        });
      }
    });

  openTabsCache.set(currentSpaceId, {
    tabs: existing?.tabs ?? [],
    focusedTabIds: existing?.focusedTabIds ?? {},
    loadedAt: existing?.loadedAt ?? 0,
    refreshPromise
  });

  return refreshPromise;
}

export function getOpenTabSuggestions(trimmedInput: string): OpenTabSuggestion[] {
  if (trimmedInput.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const currentSpaceId = getOmniboxCurrentSpaceId();
  if (!currentSpaceId) {
    return [];
  }

  const cacheEntry = openTabsCache.get(currentSpaceId);
  if (!cacheEntry || cacheEntry.tabs.length === 0) {
    return [];
  }

  const inputLower = trimmedInput.toLowerCase();
  const inputLooksLikeUrl = isUrlLikeInput(trimmedInput);

  return getEligibleOpenTabs(cacheEntry, currentSpaceId)
    .map((tab) => {
      const relevance = getOpenTabRelevance(tab, inputLower, inputLooksLikeUrl);
      if (relevance === null) {
        return null;
      }

      return {
        suggestion: createOpenTabSuggestion(tab, relevance, false),
        lastActiveAt: tab.lastActiveAt
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null)
    .sort((left, right) => {
      if (right.suggestion.relevance !== left.suggestion.relevance) {
        return right.suggestion.relevance - left.suggestion.relevance;
      }
      if (right.lastActiveAt !== left.lastActiveAt) {
        return right.lastActiveAt - left.lastActiveAt;
      }
      return left.suggestion.url.localeCompare(right.suggestion.url);
    })
    .slice(0, OPEN_TAB_LIMIT)
    .map((entry) => entry.suggestion);
}

export function getZeroSuggestOpenTabSuggestions(): OpenTabSuggestion[] {
  const currentSpaceId = getOmniboxCurrentSpaceId();
  if (!currentSpaceId) {
    return [];
  }

  const cacheEntry = openTabsCache.get(currentSpaceId);
  if (!cacheEntry || cacheEntry.tabs.length === 0) {
    return [];
  }

  const eligibleTabs = getEligibleOpenTabs(cacheEntry, currentSpaceId);
  if (eligibleTabs.length === 0) {
    return [];
  }

  const relevanceStep =
    ZERO_SUGGEST_OPEN_TAB_LIMIT > 1
      ? (ZERO_SUGGEST_OPEN_TAB_MAX_RELEVANCE - ZERO_SUGGEST_OPEN_TAB_MIN_RELEVANCE) / (ZERO_SUGGEST_OPEN_TAB_LIMIT - 1)
      : 0;

  return eligibleTabs
    .sort((left, right) => {
      if (right.lastActiveAt !== left.lastActiveAt) {
        return right.lastActiveAt - left.lastActiveAt;
      }
      return left.url.localeCompare(right.url);
    })
    .slice(0, ZERO_SUGGEST_OPEN_TAB_LIMIT)
    .map((tab, index) =>
      createOpenTabSuggestion(tab, Math.round(ZERO_SUGGEST_OPEN_TAB_MAX_RELEVANCE - index * relevanceStep), true)
    );
}
