import type { BrowsingHistoryEntry } from "~/types/history";

export interface FlowHistoryAPI {
  /** Browsing history for the current window’s profile (active space). */
  list: () => Promise<BrowsingHistoryEntry[]>;
}
