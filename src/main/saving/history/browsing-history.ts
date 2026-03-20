import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/saving/db";
import { historyUrls, historyVisits } from "@/saving/db/schema";
import type {
  BrowsingHistoryEntry,
  BrowsingHistoryVisit,
  HistoryVisitsPage,
  HistoryVisitsPageCursor
} from "~/types/history";

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
    tx.insert(historyVisits)
      .values({ urlId, visitTime: now, typed: args.incrementTyped ?? false })
      .run();
  });
}

/** Update stored title when the live tab title changes (no new visit row). */
export function updateBrowsingHistoryTitleForOpenPage(args: { profileId: string; url: string; title: string }): void {
  const trimmed = args.title.trim();
  if (!trimmed) return;

  getDb()
    .update(historyUrls)
    .set({ title: trimmed })
    .where(and(eq(historyUrls.profileId, args.profileId), eq(historyUrls.url, args.url)))
    .run();
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

const VISIT_LIST_LIMIT = 2500;

export function listBrowsingVisitsForProfile(profileId: string, search?: string): BrowsingHistoryVisit[] {
  const db = getDb();
  const q = search?.trim();
  const profileCond = eq(historyUrls.profileId, profileId);
  const searchCond =
    q && q.length > 0
      ? or(
          sql`instr(lower(${historyUrls.url}), lower(${q})) > 0`,
          sql`instr(lower(${historyUrls.title}), lower(${q})) > 0`
        )
      : undefined;

  const rows = db
    .select({
      visitId: historyVisits.id,
      urlRowId: historyUrls.id,
      url: historyUrls.url,
      title: historyUrls.title,
      visitTime: historyVisits.visitTime
    })
    .from(historyVisits)
    .innerJoin(historyUrls, eq(historyVisits.urlId, historyUrls.id))
    .where(searchCond ? and(profileCond, searchCond) : profileCond)
    .orderBy(desc(historyVisits.visitTime))
    .limit(VISIT_LIST_LIMIT)
    .all();

  return rows.map((row) => ({
    visitId: row.visitId,
    urlRowId: row.urlRowId,
    url: row.url,
    title: row.title,
    visitTime: row.visitTime
  }));
}

const HISTORY_PAGE_DEFAULT_LIMIT = 80;
const HISTORY_PAGE_MAX_LIMIT = 200;

export function listBrowsingVisitsPageForProfile(
  profileId: string,
  args: { search?: string; limit?: number; cursor?: HistoryVisitsPageCursor }
): HistoryVisitsPage {
  const db = getDb();
  const q = args.search?.trim();
  const profileCond = eq(historyUrls.profileId, profileId);
  const searchCond =
    q && q.length > 0
      ? or(
          sql`instr(lower(${historyUrls.url}), lower(${q})) > 0`,
          sql`instr(lower(${historyUrls.title}), lower(${q})) > 0`
        )
      : undefined;

  const cursor = args.cursor;
  const cursorCond =
    cursor != null
      ? or(
          lt(historyVisits.visitTime, cursor.visitTime),
          and(eq(historyVisits.visitTime, cursor.visitTime), lt(historyVisits.id, cursor.visitId))
        )
      : undefined;

  const conditions = [profileCond];
  if (searchCond) conditions.push(searchCond);
  if (cursorCond) conditions.push(cursorCond);

  const rawLimit = args.limit ?? HISTORY_PAGE_DEFAULT_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), HISTORY_PAGE_MAX_LIMIT);

  const rows = db
    .select({
      visitId: historyVisits.id,
      urlRowId: historyUrls.id,
      url: historyUrls.url,
      title: historyUrls.title,
      visitTime: historyVisits.visitTime
    })
    .from(historyVisits)
    .innerJoin(historyUrls, eq(historyVisits.urlId, historyUrls.id))
    .where(and(...conditions))
    .orderBy(desc(historyVisits.visitTime), desc(historyVisits.id))
    .limit(limit + 1)
    .all();

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const last = slice[slice.length - 1];
  const nextCursor: HistoryVisitsPageCursor | null =
    hasMore && last != null ? { visitTime: last.visitTime, visitId: last.visitId } : null;

  const visits: BrowsingHistoryVisit[] = slice.map((row) => ({
    visitId: row.visitId,
    urlRowId: row.urlRowId,
    url: row.url,
    title: row.title,
    visitTime: row.visitTime
  }));

  return { visits, nextCursor };
}

/** After deleting one or more visits for a URL, refresh aggregates or drop the URL row. */
export function reconcileUrlAggregatesAfterVisitChange(urlId: number): void {
  const db = getDb();
  const stats = db
    .select({
      cnt: sql<number>`count(*)`,
      typedCnt: sql<number>`coalesce(sum(${historyVisits.typed}), 0)`,
      maxT: sql<number | null>`max(${historyVisits.visitTime})`
    })
    .from(historyVisits)
    .where(eq(historyVisits.urlId, urlId))
    .get();

  const cnt = Number(stats?.cnt ?? 0);
  if (cnt === 0) {
    db.delete(historyUrls).where(eq(historyUrls.id, urlId)).run();
    return;
  }

  db.update(historyUrls)
    .set({
      visitCount: cnt,
      typedCount: Number(stats!.typedCnt ?? 0),
      lastVisitTime: stats!.maxT ?? Date.now()
    })
    .where(eq(historyUrls.id, urlId))
    .run();
}

export function deleteBrowsingVisitForProfile(profileId: string, visitId: number): boolean {
  const db = getDb();
  const hit = db
    .select({ urlId: historyVisits.urlId })
    .from(historyVisits)
    .innerJoin(historyUrls, eq(historyVisits.urlId, historyUrls.id))
    .where(and(eq(historyVisits.id, visitId), eq(historyUrls.profileId, profileId)))
    .limit(1)
    .all();

  if (!hit[0]) return false;
  const urlId = hit[0].urlId;
  db.delete(historyVisits).where(eq(historyVisits.id, visitId)).run();
  reconcileUrlAggregatesAfterVisitChange(urlId);
  return true;
}

export function deleteBrowsingUrlRowForProfile(profileId: string, urlRowId: number): boolean {
  const db = getDb();
  const exists = db
    .select({ id: historyUrls.id })
    .from(historyUrls)
    .where(and(eq(historyUrls.id, urlRowId), eq(historyUrls.profileId, profileId)))
    .limit(1)
    .all();
  if (!exists[0]) return false;

  db.delete(historyVisits).where(eq(historyVisits.urlId, urlRowId)).run();
  db.delete(historyUrls).where(eq(historyUrls.id, urlRowId)).run();
  return true;
}

export function clearBrowsingHistoryForProfile(profileId: string): void {
  const db = getDb();
  const ids = db
    .select({ id: historyUrls.id })
    .from(historyUrls)
    .where(eq(historyUrls.profileId, profileId))
    .all()
    .map((r) => r.id);
  if (ids.length === 0) return;
  db.delete(historyVisits).where(inArray(historyVisits.urlId, ids)).run();
  db.delete(historyUrls).where(eq(historyUrls.profileId, profileId)).run();
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
      typed_count = COALESCE((SELECT SUM(typed) FROM history_visits WHERE history_visits.url_id = history_urls.id), 0),
      last_visit_time = COALESCE((SELECT MAX(visit_time) FROM history_visits WHERE history_visits.url_id = history_urls.id), last_visit_time)`
  );
}
