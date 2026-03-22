/** Represents a learned omnibox shortcut from the main process DB */
export interface OmniboxShortcutEntry {
  id: number;
  inputText: string;
  destinationUrl: string;
  destinationTitle: string;
  matchType: string;
  hitCount: number;
  lastAccessTime: number;
}

export interface FlowOmniboxShortcutsAPI {
  /** Search for shortcuts matching the given input text */
  search: (inputText: string, limit?: number) => Promise<OmniboxShortcutEntry[]>;

  /** Record a shortcut when the user selects an omnibox suggestion (fire-and-forget) */
  recordUsage: (inputText: string, destinationUrl: string, destinationTitle: string, matchType: string) => void;

  /** Get all shortcuts for a specific destination URL */
  getForUrl: (destinationUrl: string) => Promise<OmniboxShortcutEntry[]>;

  /** Cleanup old shortcuts, returns number of rows deleted */
  cleanup: (maxAgeDays?: number) => Promise<number>;
}
