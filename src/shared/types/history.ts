/** Aggregated URL row returned to the renderer (Chromium `urls`-table shape, simplified). */
export type BrowsingHistoryEntry = {
  id: number;
  url: string;
  title: string;
  visitCount: number;
  typedCount: number;
  lastVisitTime: number;
};

/** One row per visit for the history UI (join of `visits` + `urls`). */
export type BrowsingHistoryVisit = {
  visitId: number;
  urlRowId: number;
  url: string;
  title: string;
  visitTime: number;
};

/** Cursor for keyset pagination of visits (newest first). */
export type HistoryVisitsPageCursor = {
  visitTime: number;
  visitId: number;
};

export type HistoryVisitsPage = {
  visits: BrowsingHistoryVisit[];
  nextCursor: HistoryVisitsPageCursor | null;
};
