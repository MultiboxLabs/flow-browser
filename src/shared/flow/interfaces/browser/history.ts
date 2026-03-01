/** Represents a history entry from the main process DB */
export interface HistoryEntry {
  id: number;
  url: string;
  title: string;
  visitCount: number;
  typedCount: number;
  lastVisitTime: number;
  firstVisitTime: number;
  lastVisitType: number;
}

/** Visit type constants matching the main process VisitType */
export const VisitType = {
  LINK: 0,
  TYPED: 1,
  BOOKMARK: 2,
  REDIRECT: 3,
  RELOAD: 4
} as const;

export type VisitTypeValue = (typeof VisitType)[keyof typeof VisitType];

export interface FlowHistoryAPI {
  /** Get significant history entries for IMUI population */
  getSignificant: () => Promise<HistoryEntry[]>;

  /** Search history by URL or title substring */
  search: (query: string, limit?: number) => Promise<HistoryEntry[]>;

  /** Record a visit to a URL (fire-and-forget) */
  recordVisit: (url: string, title: string, visitType?: VisitTypeValue) => void;

  /** Get recent history entries for zero-suggest */
  getRecent: (limit?: number) => Promise<HistoryEntry[]>;

  /** Get most visited history entries */
  getMostVisited: (limit?: number) => Promise<HistoryEntry[]>;
}
