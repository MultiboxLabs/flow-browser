import { ipcMain } from "electron";
import { historyService, VisitType, type VisitTypeValue } from "@/saving/history/history-service";

// --- History IPC Handlers ---

/**
 * Get significant history entries for IMUI population.
 * Returns entries that are typed, frequently visited, or recently visited.
 */
ipcMain.handle("history:get-significant", async () => {
  return historyService.getSignificant();
});

/**
 * Search history by URL or title substring.
 * Used by HistoryURLProvider for async DB queries.
 */
ipcMain.handle("history:search", async (_event, query: string, limit?: number) => {
  return historyService.search(query, limit);
});

/**
 * Record a visit to a URL.
 * Called from the renderer when navigations occur.
 */
ipcMain.on("history:record-visit", (_event, url: string, title: string, visitType: VisitTypeValue = VisitType.LINK) => {
  historyService.recordVisit(url, title, visitType);
});

/**
 * Get recent history entries for zero-suggest.
 */
ipcMain.handle("history:get-recent", async (_event, limit?: number) => {
  return historyService.getRecent(limit);
});

/**
 * Get most visited history entries.
 */
ipcMain.handle("history:get-most-visited", async (_event, limit?: number) => {
  return historyService.getMostVisited(limit);
});
