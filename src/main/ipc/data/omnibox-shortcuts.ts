import { ipcMain } from "electron";
import { omniboxShortcutsService } from "@/saving/omnibox-shortcuts/shortcuts-service";

// --- Omnibox Shortcuts IPC Handlers ---

/**
 * Search for shortcuts matching the given input text.
 * Used by ShortcutsProvider in the renderer for omnibox suggestions.
 */
ipcMain.handle("omnibox-shortcuts:search", async (_event, inputText: string, limit?: number) => {
  return omniboxShortcutsService.search(inputText, limit);
});

/**
 * Record a shortcut when the user selects an omnibox suggestion.
 * Fire-and-forget — called from the renderer when the user picks a result.
 */
ipcMain.on(
  "omnibox-shortcuts:record-usage",
  (_event, inputText: string, destinationUrl: string, destinationTitle: string, matchType: string) => {
    omniboxShortcutsService.recordUsage(inputText, destinationUrl, destinationTitle, matchType);
  }
);

/**
 * Get all shortcuts for a specific destination URL.
 */
ipcMain.handle("omnibox-shortcuts:get-for-url", async (_event, destinationUrl: string) => {
  return omniboxShortcutsService.getForUrl(destinationUrl);
});

/**
 * Cleanup old shortcuts. Returns number of rows deleted.
 */
ipcMain.handle("omnibox-shortcuts:cleanup", async (_event, maxAgeDays?: number) => {
  return omniboxShortcutsService.cleanup(maxAgeDays);
});
