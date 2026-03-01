/**
 * Bookmarks data provider — STUB (Phase 4).
 *
 * TODO: The bookmarks system is not yet implemented in the app.
 * When a bookmarks service + IPC layer is built, this file should:
 *   1. Define a `BookmarkEntry` type matching the bookmarks table schema
 *   2. Expose `searchBookmarks(query, limit)` — searches by URL and title
 *   3. Expose `isUrlBookmarked(url)` — fast lookup for the isBookmarked signal
 *   4. Expose `getAllBookmarks()` — for populating an in-memory bookmark index
 *
 * The BookmarkProvider (providers/bookmark.ts) depends on this module.
 */

/** Placeholder bookmark entry type matching the DB schema */
export interface BookmarkEntry {
  id: number;
  url: string;
  title: string;
  parentFolderId: number | null;
  position: number;
  createdAt: number;
  isFolder: boolean;
}

/**
 * Search bookmarks by query string (URL or title substring).
 *
 * TODO: Implement via IPC when bookmarks service exists.
 * Should call `flow.bookmarks.search(query, limit)`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function searchBookmarks(_query: string, _limit?: number): Promise<BookmarkEntry[]> {
  // TODO: Implement when bookmarks system is available
  return [];
}

/**
 * Check if a URL is bookmarked.
 *
 * TODO: Implement via IPC when bookmarks service exists.
 * This is used cross-provider to set the `isBookmarked` scoring signal.
 * Should be fast — consider maintaining a Set<string> of bookmarked URLs
 * in the renderer process, refreshed periodically.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function isUrlBookmarked(_url: string): Promise<boolean> {
  // TODO: Implement when bookmarks system is available
  return false;
}

/**
 * Get all bookmarks for populating an in-memory index.
 *
 * TODO: Implement via IPC when bookmarks service exists.
 * Should call `flow.bookmarks.getAll()`.
 */
export async function getAllBookmarks(): Promise<BookmarkEntry[]> {
  // TODO: Implement when bookmarks system is available
  return [];
}
