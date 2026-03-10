import type { HistoryEntry } from "~/flow/interfaces/browser/history";

export type { HistoryEntry };

/**
 * Get significant history entries from the main process via IPC.
 * These are entries that are typed, frequently visited, or recently visited.
 * Used for IMUI population and quick matching.
 */
export async function getSignificantHistory(): Promise<HistoryEntry[]> {
  try {
    return await flow.history.getSignificant();
  } catch (err) {
    console.error("[HistoryDataProvider] Failed to get significant history:", err);
    return [];
  }
}

/**
 * Search history by query string (URL or title substring).
 * Used by HistoryURLProvider for async DB-backed matching.
 */
export async function searchHistory(query: string, limit?: number): Promise<HistoryEntry[]> {
  try {
    return await flow.history.search(query, limit);
  } catch (err) {
    console.error("[HistoryDataProvider] Failed to search history:", err);
    return [];
  }
}

/**
 * Get recent history entries for zero-suggest.
 */
export async function getRecentHistory(limit?: number): Promise<HistoryEntry[]> {
  try {
    return await flow.history.getRecent(limit);
  } catch (err) {
    console.error("[HistoryDataProvider] Failed to get recent history:", err);
    return [];
  }
}

/**
 * Get most visited history entries for zero-suggest.
 */
export async function getMostVisitedHistory(limit?: number): Promise<HistoryEntry[]> {
  try {
    return await flow.history.getMostVisited(limit);
  } catch (err) {
    console.error("[HistoryDataProvider] Failed to get most visited history:", err);
    return [];
  }
}
