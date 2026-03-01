import { getDb, schema } from "@/saving/db";
import { eq, and, desc, sql } from "drizzle-orm";
import type { OmniboxShortcutRow } from "@/saving/db/schema";

/**
 * OmniboxShortcutsService manages learned input-to-destination mappings.
 *
 * When the user types "gi" and selects "github.com", this service records that
 * mapping. On future "gi" inputs, ShortcutsProvider can offer "github.com" with
 * high confidence.
 *
 * Shortcuts use a 7-day half-life decay (shorter than history's 30 days)
 * because shortcut relevance is more ephemeral — it reflects recent habits.
 */
export class OmniboxShortcutsService {
  /**
   * Record or update a shortcut when the user selects an omnibox suggestion.
   *
   * If an identical (inputText, destinationUrl) pair exists, increment hit_count
   * and update last_access_time. Otherwise insert a new row.
   */
  recordUsage(inputText: string, destinationUrl: string, destinationTitle: string, matchType: string): void {
    if (!inputText.trim() || !destinationUrl.trim()) return;

    try {
      const db = getDb();
      const normalizedInput = inputText.toLowerCase().trim();

      const existing = db
        .select()
        .from(schema.omniboxShortcuts)
        .where(
          and(
            eq(schema.omniboxShortcuts.inputText, normalizedInput),
            eq(schema.omniboxShortcuts.destinationUrl, destinationUrl)
          )
        )
        .get();

      if (existing) {
        db.update(schema.omniboxShortcuts)
          .set({
            hitCount: existing.hitCount + 1,
            lastAccessTime: Date.now(),
            destinationTitle: destinationTitle || existing.destinationTitle,
            matchType
          })
          .where(eq(schema.omniboxShortcuts.id, existing.id))
          .run();
      } else {
        db.insert(schema.omniboxShortcuts)
          .values({
            inputText: normalizedInput,
            destinationUrl,
            destinationTitle: destinationTitle || "",
            matchType,
            hitCount: 1,
            lastAccessTime: Date.now()
          })
          .run();
      }
    } catch (err) {
      console.error("[OmniboxShortcutsService] Failed to record usage:", err);
    }
  }

  /**
   * Search for shortcuts matching the given input text.
   * Returns shortcuts where the stored inputText is a prefix of (or equal to)
   * the current input, ordered by relevance (hit count decayed by recency).
   *
   * @param inputText The text the user has typed so far
   * @param limit Maximum results to return
   */
  search(inputText: string, limit: number = 10): OmniboxShortcutRow[] {
    if (!inputText.trim()) return [];

    try {
      const db = getDb();
      const normalizedInput = inputText.toLowerCase().trim();

      // Find shortcuts where the stored input is a prefix of what the user typed
      // This means if user typed "gith", shortcuts for "gi", "git", "gith" all match
      const pattern = `${normalizedInput}%`;

      return db
        .select()
        .from(schema.omniboxShortcuts)
        .where(sql`${schema.omniboxShortcuts.inputText} LIKE ${pattern}`)
        .orderBy(desc(schema.omniboxShortcuts.lastAccessTime))
        .limit(limit)
        .all();
    } catch (err) {
      console.error("[OmniboxShortcutsService] Failed to search shortcuts:", err);
      return [];
    }
  }

  /**
   * Get all shortcuts for a specific destination URL.
   * Useful for checking if a URL has any shortcut associations.
   */
  getForUrl(destinationUrl: string): OmniboxShortcutRow[] {
    try {
      const db = getDb();

      return db
        .select()
        .from(schema.omniboxShortcuts)
        .where(eq(schema.omniboxShortcuts.destinationUrl, destinationUrl))
        .orderBy(desc(schema.omniboxShortcuts.hitCount))
        .all();
    } catch (err) {
      console.error("[OmniboxShortcutsService] Failed to get shortcuts for URL:", err);
      return [];
    }
  }

  /**
   * Delete old/unused shortcuts to prevent unbounded growth.
   * Removes shortcuts that haven't been accessed in the given number of days.
   */
  cleanup(maxAgeDays: number = 90): number {
    try {
      const db = getDb();
      const cutoff = Date.now() - maxAgeDays * 86400000;

      const result = db
        .delete(schema.omniboxShortcuts)
        .where(sql`${schema.omniboxShortcuts.lastAccessTime} < ${cutoff}`)
        .run();

      return result.changes;
    } catch (err) {
      console.error("[OmniboxShortcutsService] Failed to cleanup shortcuts:", err);
      return 0;
    }
  }
}

export const omniboxShortcutsService = new OmniboxShortcutsService();
