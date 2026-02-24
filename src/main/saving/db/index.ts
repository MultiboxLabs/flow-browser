import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import { app } from "electron";
import { FLOW_DATA_DIR } from "@/modules/paths";
import { debugPrint, debugError } from "@/modules/output";
import * as schema from "./schema";

const DB_PATH = path.join(FLOW_DATA_DIR, "flow.db");

let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get the path to the drizzle migrations folder.
 * In development: ./drizzle (relative to project root via app.getAppPath())
 * In production: {resourcesPath}/drizzle (copied via extraResources)
 */
function getMigrationsPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "drizzle");
  }
  // In development, app.getAppPath() returns the project root
  return path.join(app.getAppPath(), "drizzle");
}

/**
 * Initialize the SQLite database connection and run migrations.
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

  db = drizzle(sqlite, { schema });

  // Run migrations
  const migrationsFolder = getMigrationsPath();
  debugPrint("DB", `Running migrations from ${migrationsFolder}`);

  try {
    migrate(db, { migrationsFolder });
    debugPrint("DB", "Migrations applied successfully");
  } catch (err) {
    debugError("DB", "Migration failed:", err);
    throw err;
  }

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
