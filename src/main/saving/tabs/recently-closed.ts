import { getDb, schema } from "@/saving/db";
import { RecentlyClosedTabData, PersistedTabData, PersistedTabGroupData } from "~/types/tabs";
import { getCurrentTimestamp } from "@/modules/utils";
import { eq, desc } from "drizzle-orm";

const MAX_RECENTLY_CLOSED = 25;

/**
 * Manages a capped list of recently closed tabs that can be restored.
 * Stored in SQLite via drizzle.
 */
export class RecentlyClosedManager {
  /**
   * Add a tab to the recently closed list.
   * Maintains a FIFO queue capped at MAX_RECENTLY_CLOSED entries.
   */
  async add(tabData: PersistedTabData, tabGroupData?: PersistedTabGroupData): Promise<void> {
    try {
      const db = getDb();
      const closedAt = getCurrentTimestamp();

      db.transaction((tx) => {
        // Insert or replace the entry
        tx.insert(schema.recentlyClosed)
          .values({
            uniqueId: tabData.uniqueId,
            closedAt,
            tabData,
            tabGroupData: tabGroupData ?? null
          })
          .onConflictDoUpdate({
            target: schema.recentlyClosed.uniqueId,
            set: {
              closedAt,
              tabData,
              tabGroupData: tabGroupData ?? null
            }
          })
          .run();

        // Get count and delete oldest entries beyond the cap
        const allEntries = tx
          .select({ uniqueId: schema.recentlyClosed.uniqueId })
          .from(schema.recentlyClosed)
          .orderBy(desc(schema.recentlyClosed.closedAt))
          .all();

        if (allEntries.length > MAX_RECENTLY_CLOSED) {
          const toDelete = allEntries.slice(MAX_RECENTLY_CLOSED);
          for (const entry of toDelete) {
            tx.delete(schema.recentlyClosed).where(eq(schema.recentlyClosed.uniqueId, entry.uniqueId)).run();
          }
        }
      });
    } catch (err) {
      console.error("[RecentlyClosedManager] Failed to add entry:", err);
    }
  }

  /**
   * Get all recently closed tabs, sorted by most recently closed first.
   */
  async getAll(): Promise<RecentlyClosedTabData[]> {
    const db = getDb();
    const rows = db.select().from(schema.recentlyClosed).orderBy(desc(schema.recentlyClosed.closedAt)).all();

    return rows.map((row) => ({
      closedAt: row.closedAt,
      tabData: row.tabData,
      tabGroupData: row.tabGroupData ?? undefined
    }));
  }

  /**
   * Restore a recently closed tab by uniqueId.
   * Removes it from the recently closed store and returns the persisted data
   * along with any tab group data the tab belonged to.
   */
  async restore(uniqueId: string): Promise<{ tabData: PersistedTabData; tabGroupData?: PersistedTabGroupData } | null> {
    const db = getDb();

    const row = db.select().from(schema.recentlyClosed).where(eq(schema.recentlyClosed.uniqueId, uniqueId)).get();

    if (!row) return null;

    db.delete(schema.recentlyClosed).where(eq(schema.recentlyClosed.uniqueId, uniqueId)).run();

    return {
      tabData: row.tabData,
      tabGroupData: row.tabGroupData ?? undefined
    };
  }

  /**
   * Clear all recently closed tabs.
   */
  async clear(): Promise<void> {
    const db = getDb();
    db.delete(schema.recentlyClosed).run();
  }
}

export const recentlyClosedManager = new RecentlyClosedManager();
