import { and, desc, eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/saving/db";
import { historyUrls, historyVisits } from "@/saving/db/schema";
import type { BrowsingHistoryEntry } from "~/types/history";

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export function isHistoryRecordableUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function recordBrowsingHistoryVisit(args: {
  profileId: string;
  url: string;
  title: string;
  incrementTyped?: boolean;
}): void {
  const db = getDb();
  const now = Date.now();
  let displayTitle = args.title.trim();
  if (!displayTitle) {
    try {
      displayTitle = new URL(args.url).hostname;
    } catch {
      displayTitle = args.url;
    }
  }

  db.transaction((tx) => {
    const existing = tx
      .select()
      .from(historyUrls)
      .where(and(eq(historyUrls.profileId, args.profileId), eq(historyUrls.url, args.url)))
      .limit(1)
      .all();

    let urlId: number;
    if (existing[0]) {
      const row = existing[0];
      urlId = row.id;
      tx.update(historyUrls)
        .set({
          visitCount: row.visitCount + 1,
          lastVisitTime: now,
          title: displayTitle || row.title,
          typedCount: args.incrementTyped ? row.typedCount + 1 : row.typedCount
        })
        .where(eq(historyUrls.id, urlId))
        .run();
    } else {
      const inserted = tx
        .insert(historyUrls)
        .values({
          profileId: args.profileId,
          url: args.url,
          title: displayTitle,
          visitCount: 1,
          typedCount: args.incrementTyped ? 1 : 0,
          lastVisitTime: now
        })
        .returning({ id: historyUrls.id })
        .all();
      urlId = inserted[0]!.id;
    }
    tx.insert(historyVisits).values({ urlId, visitTime: now }).run();
  });
}

export function listBrowsingHistoryForProfile(profileId: string): BrowsingHistoryEntry[] {
  const rows = getDb()
    .select()
    .from(historyUrls)
    .where(eq(historyUrls.profileId, profileId))
    .orderBy(desc(historyUrls.lastVisitTime))
    .all();

  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    visitCount: row.visitCount,
    typedCount: row.typedCount,
    lastVisitTime: row.lastVisitTime
  }));
}

/** Drop visits older than 90 days and reconcile URL aggregates. */
export function pruneBrowsingHistory(): void {
  const db = getDb();
  const cutoff = Date.now() - RETENTION_MS;
  db.delete(historyVisits).where(lt(historyVisits.visitTime, cutoff)).run();
  db.delete(historyUrls)
    .where(sql`id NOT IN (SELECT DISTINCT url_id FROM history_visits)`)
    .run();
  db.run(
    sql`UPDATE history_urls SET
      visit_count = (SELECT COUNT(*) FROM history_visits WHERE history_visits.url_id = history_urls.id),
      last_visit_time = COALESCE((SELECT MAX(visit_time) FROM history_visits WHERE history_visits.url_id = history_urls.id), last_visit_time)`
  );
}
