import type { OmniboxShortcutEntry } from "~/flow/interfaces/browser/omnibox-shortcuts";

export type { OmniboxShortcutEntry };

/**
 * Search for shortcuts matching the given input text via IPC.
 * Used by ShortcutsProvider for omnibox suggestions.
 */
export async function searchShortcuts(inputText: string, limit?: number): Promise<OmniboxShortcutEntry[]> {
  try {
    return await flow.omniboxShortcuts.search(inputText, limit);
  } catch (err) {
    console.error("[ShortcutsDataProvider] Failed to search shortcuts:", err);
    return [];
  }
}

/**
 * Record a shortcut when the user selects an omnibox suggestion.
 * Fire-and-forget — no return value.
 */
export function recordShortcutUsage(
  inputText: string,
  destinationUrl: string,
  destinationTitle: string,
  matchType: string
): void {
  try {
    flow.omniboxShortcuts.recordUsage(inputText, destinationUrl, destinationTitle, matchType);
  } catch (err) {
    console.error("[ShortcutsDataProvider] Failed to record shortcut usage:", err);
  }
}
