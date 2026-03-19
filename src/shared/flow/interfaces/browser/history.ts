import type { BrowsingHistoryEntry, BrowsingHistoryVisit } from "~/types/history";

export interface FlowHistoryAPI {
  /** Aggregated URL rows for the current window’s profile (omnibox). */
  list: () => Promise<BrowsingHistoryEntry[]>;
  /** Chronological visits with optional search (title / URL substring). */
  listVisits: (search?: string) => Promise<BrowsingHistoryVisit[]>;
  deleteVisit: (visitId: number) => Promise<boolean>;
  /** Remove all visits for one URL row. */
  deleteAllForUrl: (urlRowId: number) => Promise<boolean>;
  clearAll: () => Promise<void>;
}
