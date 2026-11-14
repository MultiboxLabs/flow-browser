import { PinnedTab } from "../core/pinned-tab";
import { getDb, schema } from "@/saving/db";
import { eq } from "drizzle-orm";

/**
 * Handles loading, saving, and deleting pinned tabs from the database.
 */
export class PinnedTabPersistence {
  /**
   * Load all pinned tab rows from the database.
   */
  loadAll(): PinnedTab[] {
    const db = getDb();
    const rows = db.select().from(schema.pinnedTabs).all();
    return rows.map((row) => new PinnedTab(row));
  }

  /**
   * Upsert a pinned tab into the database.
   */
  save(pinnedTab: PinnedTab): void {
    const db = getDb();
    db.insert(schema.pinnedTabs)
      .values({
        uniqueId: pinnedTab.uniqueId,
        profileId: pinnedTab.profileId,
        defaultUrl: pinnedTab.defaultUrl,
        faviconUrl: pinnedTab.faviconUrl,
        position: pinnedTab.position
      })
      .onConflictDoUpdate({
        target: schema.pinnedTabs.uniqueId,
        set: {
          defaultUrl: pinnedTab.defaultUrl,
          faviconUrl: pinnedTab.faviconUrl,
          position: pinnedTab.position
        }
      })
      .run();
  }

  /**
   * Delete a pinned tab from the database by uniqueId.
   */
  delete(uniqueId: string): void {
    const db = getDb();
    db.delete(schema.pinnedTabs).where(eq(schema.pinnedTabs.uniqueId, uniqueId)).run();
  }
}
