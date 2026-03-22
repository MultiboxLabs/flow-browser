import type { BrowsingHistoryEntry } from "~/types/history";

export type HistoryEntry = BrowsingHistoryEntry;

const SIGNIFICANT_VISIT_COUNT = 4;
const SIGNIFICANT_RECENT_MS = 72 * 60 * 60 * 1000;

async function getHistory(): Promise<HistoryEntry[]> {
  return flow.history.list();
}

/**
 * Omnibox history now builds on top of the app's profile-scoped browsing
 * history API. The omnibox-specific views are derived in the renderer instead
 * of going through a second history backend.
 */
export async function getSignificantHistory(): Promise<HistoryEntry[]> {
  try {
    const now = Date.now();
    const entries = await getHistory();
    return entries.filter(
      (entry) =>
        entry.typedCount >= 1 ||
        entry.visitCount >= SIGNIFICANT_VISIT_COUNT ||
        now - entry.lastVisitTime <= SIGNIFICANT_RECENT_MS
    );
  } catch (err) {
    console.error("[HistoryDataProvider] Failed to get significant history:", err);
    return [];
  }
}

export async function searchHistory(query: string, limit: number = 50): Promise<HistoryEntry[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  try {
    const entries = await getHistory();
    return entries
      .filter((entry) => entry.url.toLowerCase().includes(needle) || entry.title.toLowerCase().includes(needle))
      .slice(0, limit);
  } catch (err) {
    console.error("[HistoryDataProvider] Failed to search history:", err);
    return [];
  }
}

export async function getRecentHistory(limit: number = 10): Promise<HistoryEntry[]> {
  try {
    const entries = await getHistory();
    return entries.slice(0, limit);
  } catch (err) {
    console.error("[HistoryDataProvider] Failed to get recent history:", err);
    return [];
  }
}

export async function getMostVisitedHistory(limit: number = 10): Promise<HistoryEntry[]> {
  try {
    const entries = await getHistory();
    return [...entries]
      .sort((a, b) => b.visitCount - a.visitCount || b.lastVisitTime - a.lastVisitTime)
      .slice(0, limit);
  } catch (err) {
    console.error("[HistoryDataProvider] Failed to get most visited history:", err);
    return [];
  }
}
