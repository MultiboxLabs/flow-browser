/** Aggregated URL row returned to the renderer (Chromium `urls`-table shape, simplified). */
export type BrowsingHistoryEntry = {
  id: number;
  url: string;
  title: string;
  visitCount: number;
  typedCount: number;
  lastVisitTime: number;
};
