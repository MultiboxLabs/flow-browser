import { getDb, schema } from "@/saving/db";
import { eq, desc, gte, or, sql } from "drizzle-orm";
import type { HistoryRow } from "@/saving/db/schema";

/** Visit type constants matching Chromium's transition types */
export const VisitType = {
  LINK: 0,
  TYPED: 1,
  BOOKMARK: 2,
  REDIRECT: 3,
  RELOAD: 4
} as const;

export type VisitTypeValue = (typeof VisitType)[keyof typeof VisitType];

/** URLs that should never be recorded in history */
const EXCLUDED_URL_PREFIXES = [
  "flow:",
  "flow-internal:",
  "about:",
  "chrome-extension:",
  "devtools:",
  "data:",
  "blob:",
  "javascript:"
];

function shouldRecordUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return !EXCLUDED_URL_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * HistoryService manages browsing history collection, recording, and querying.
 * Runs in the main process with direct SQLite access.
 */
export class HistoryService {
  /**
   * Record a visit to a URL. Inserts a new history row or updates an existing one.
   *
   * @param url The URL visited
   * @param title The page title
   * @param visitType The type of visit (link, typed, bookmark, redirect, reload)
   */
  recordVisit(url: string, title: string, visitType: VisitTypeValue = VisitType.LINK): void {
    if (!shouldRecordUrl(url)) return;

    try {
      const db = getDb();
      const now = Date.now();
      const isTyped = visitType === VisitType.TYPED;

      const existing = db.select().from(schema.history).where(eq(schema.history.url, url)).get();

      if (existing) {
        db.update(schema.history)
          .set({
            visitCount: existing.visitCount + 1,
            typedCount: existing.typedCount + (isTyped ? 1 : 0),
            lastVisitTime: now,
            lastVisitType: visitType,
            title: title || existing.title
          })
          .where(eq(schema.history.id, existing.id))
          .run();
      } else {
        db.insert(schema.history)
          .values({
            url,
            title: title || "",
            visitCount: 1,
            typedCount: isTyped ? 1 : 0,
            lastVisitTime: now,
            firstVisitTime: now,
            lastVisitType: visitType
          })
          .run();
      }
    } catch (err) {
      console.error("[HistoryService] Failed to record visit:", err);
    }
  }

  /**
   * Get "significant" history entries for IMUI population.
   * Returns entries matching at least one criterion:
   * - typed_count >= 1 (ever typed in omnibox)
   * - visit_count >= 4 (frequently visited)
   * - last_visit_time >= now - 72 hours (recently visited)
   */
  getSignificant(): HistoryRow[] {
    try {
      const db = getDb();
      const seventyTwoHoursAgo = Date.now() - 72 * 60 * 60 * 1000;

      return db
        .select()
        .from(schema.history)
        .where(
          or(
            gte(schema.history.typedCount, 1),
            gte(schema.history.visitCount, 4),
            gte(schema.history.lastVisitTime, seventyTwoHoursAgo)
          )
        )
        .orderBy(desc(schema.history.lastVisitTime))
        .limit(2000)
        .all();
    } catch (err) {
      console.error("[HistoryService] Failed to get significant history:", err);
      return [];
    }
  }

  /**
   * Search history by URL or title substring.
   * Used by HistoryURLProvider for async DB queries.
   */
  search(query: string, limit: number = 50): HistoryRow[] {
    try {
      const db = getDb();
      const pattern = `%${query}%`;

      return db
        .select()
        .from(schema.history)
        .where(or(sql`${schema.history.url} LIKE ${pattern}`, sql`${schema.history.title} LIKE ${pattern}`))
        .orderBy(desc(schema.history.lastVisitTime))
        .limit(limit)
        .all();
    } catch (err) {
      console.error("[HistoryService] Failed to search history:", err);
      return [];
    }
  }

  /**
   * Get recent history entries for zero-suggest.
   * Returns the most recently visited entries sorted by last visit time.
   */
  getRecent(limit: number = 10): HistoryRow[] {
    try {
      const db = getDb();

      return db.select().from(schema.history).orderBy(desc(schema.history.lastVisitTime)).limit(limit).all();
    } catch (err) {
      console.error("[HistoryService] Failed to get recent history:", err);
      return [];
    }
  }

  /**
   * Get most visited history entries for zero-suggest.
   * Returns entries sorted by visit count (frecency proxy).
   */
  getMostVisited(limit: number = 10): HistoryRow[] {
    try {
      const db = getDb();

      return db.select().from(schema.history).orderBy(desc(schema.history.visitCount)).limit(limit).all();
    } catch (err) {
      console.error("[HistoryService] Failed to get most visited history:", err);
      return [];
    }
  }
}

export const historyService = new HistoryService();
