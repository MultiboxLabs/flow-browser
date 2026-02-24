import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import { FLOW_DATA_DIR } from "@/modules/paths";
import { debugPrint, debugError } from "@/modules/output";
import * as schema from "./schema";

const DB_PATH = path.join(FLOW_DATA_DIR, "flow.db");

let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Initialize the SQLite database connection and configure pragmas.
 * Creates tables if they don't exist.
 */
function initDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (db) return db;

  debugPrint("DB", `Initializing database at ${DB_PATH}`);

  sqlite = new Database(DB_PATH);

  // Configure SQLite pragmas for performance and concurrency
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("cache_size = -64000"); // 64MB cache
  sqlite.pragma("busy_timeout = 3000");

  debugPrint("DB", "Configured SQLite pragmas");

  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tabs (
      unique_id TEXT PRIMARY KEY,
      schema_version INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      last_active_at INTEGER NOT NULL,
      position INTEGER NOT NULL,
      profile_id TEXT NOT NULL,
      space_id TEXT NOT NULL,
      window_group_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      favicon_url TEXT,
      muted INTEGER NOT NULL DEFAULT 0,
      nav_history TEXT NOT NULL DEFAULT '[]',
      nav_history_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tab_groups (
      group_id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      space_id TEXT NOT NULL,
      tab_unique_ids TEXT NOT NULL DEFAULT '[]',
      glance_front_tab_unique_id TEXT,
      position INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS window_states (
      window_group_id TEXT PRIMARY KEY,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      x INTEGER,
      y INTEGER,
      is_popup INTEGER
    );

    CREATE TABLE IF NOT EXISTS recently_closed (
      unique_id TEXT PRIMARY KEY,
      closed_at INTEGER NOT NULL,
      tab_data TEXT NOT NULL,
      tab_group_data TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tabs_window_group_id ON tabs(window_group_id);
    CREATE INDEX IF NOT EXISTS idx_tabs_last_active_at ON tabs(last_active_at);
    CREATE INDEX IF NOT EXISTS idx_recently_closed_closed_at ON recently_closed(closed_at);
  `);

  debugPrint("DB", "Tables created/verified");

  db = drizzle(sqlite, { schema });

  debugPrint("DB", "Database initialized successfully");

  return db;
}

/**
 * Get the drizzle database instance.
 * Initializes the connection lazily on first call.
 */
export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Close the database connection cleanly.
 * Should be called during app shutdown.
 */
export function closeDatabase(): void {
  if (sqlite) {
    debugPrint("DB", "Closing database connection");
    try {
      sqlite.close();
      debugPrint("DB", "Database connection closed");
    } catch (err) {
      debugError("DB", "Error closing database:", err);
    }
    sqlite = null;
    db = null;
  }
}

// Re-export schema for convenience
export { schema };
