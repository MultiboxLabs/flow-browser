import type {
  BrowsingHistoryEntry,
  BrowsingHistoryVisit,
  HistoryVisitsPage,
  HistoryVisitsPageCursor
} from "~/types/history";

export interface FlowHistoryAPI {
  /** Aggregated URL rows for the current window’s profile (omnibox). */
  list: () => Promise<BrowsingHistoryEntry[]>;
  /** Chronological visits with optional search (title / URL substring). */
  listVisits: (search?: string) => Promise<BrowsingHistoryVisit[]>;
  /** Paginated visits (newest first) for infinite scroll. */
  listVisitsPage: (args: {
    search?: string;
    limit: number;
    cursor?: HistoryVisitsPageCursor;
  }) => Promise<HistoryVisitsPage>;
  deleteVisit: (visitId: number) => Promise<boolean>;
  /** Remove all visits for one URL row. */
  deleteAllForUrl: (urlRowId: number) => Promise<boolean>;
  clearAll: () => Promise<void>;
}
