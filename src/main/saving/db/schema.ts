import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { NavigationEntry, PersistedTabData, PersistedTabGroupData, TabGroupMode } from "~/types/tabs";

// --- Tabs Table ---

export const tabs = sqliteTable(
  "tabs",
  {
    uniqueId: text("unique_id").primaryKey(),
    schemaVersion: integer("schema_version").notNull(),
    createdAt: integer("created_at").notNull(),
    lastActiveAt: integer("last_active_at").notNull(),
    position: integer("position").notNull(),
    profileId: text("profile_id").notNull(),
    spaceId: text("space_id").notNull(),
    windowGroupId: text("window_group_id").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    faviconUrl: text("favicon_url"),
    muted: integer("muted", { mode: "boolean" }).notNull(),
    navHistory: text("nav_history", { mode: "json" }).$type<NavigationEntry[]>().notNull(),
    navHistoryIndex: integer("nav_history_index").notNull()
  },
  (table) => [index("idx_tabs_window_group_id").on(table.windowGroupId)]
);

export type TabRow = typeof tabs.$inferSelect;
export type TabInsert = typeof tabs.$inferInsert;

// --- Tab Groups Table ---

export const tabGroups = sqliteTable("tab_groups", {
  groupId: text("group_id").primaryKey(),
  mode: text("mode").$type<Exclude<TabGroupMode, "normal">>().notNull(),
  profileId: text("profile_id").notNull(),
  spaceId: text("space_id").notNull(),
  tabUniqueIds: text("tab_unique_ids", { mode: "json" }).$type<string[]>().notNull(),
  glanceFrontTabUniqueId: text("glance_front_tab_unique_id"),
  position: integer("position").notNull()
});

export type TabGroupRow = typeof tabGroups.$inferSelect;
export type TabGroupInsert = typeof tabGroups.$inferInsert;

// --- Window States Table ---

export const windowStates = sqliteTable("window_states", {
  windowGroupId: text("window_group_id").primaryKey(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  x: integer("x"),
  y: integer("y"),
  isPopup: integer("is_popup", { mode: "boolean" })
});

export type WindowStateRow = typeof windowStates.$inferSelect;
export type WindowStateInsert = typeof windowStates.$inferInsert;

// --- Recently Closed Table ---

export const recentlyClosed = sqliteTable(
  "recently_closed",
  {
    uniqueId: text("unique_id").primaryKey(),
    closedAt: integer("closed_at").notNull(),
    tabData: text("tab_data", { mode: "json" }).$type<PersistedTabData>().notNull(),
    tabGroupData: text("tab_group_data", { mode: "json" }).$type<PersistedTabGroupData>()
  },
  (table) => [index("idx_recently_closed_closed_at").on(table.closedAt)]
);

export type RecentlyClosedRow = typeof recentlyClosed.$inferSelect;
export type RecentlyClosedInsert = typeof recentlyClosed.$inferInsert;

// --- History Table ---

export const history = sqliteTable(
  "history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    url: text("url").notNull(),
    title: text("title").notNull().default(""),
    visitCount: integer("visit_count").notNull().default(1),
    typedCount: integer("typed_count").notNull().default(0),
    lastVisitTime: integer("last_visit_time").notNull(), // epoch ms
    firstVisitTime: integer("first_visit_time").notNull(), // epoch ms
    // Bitfield: 0=link, 1=typed, 2=bookmark, 3=redirect, 4=reload
    lastVisitType: integer("last_visit_type").notNull().default(0)
  },
  (table) => [
    index("idx_history_url").on(table.url),
    index("idx_history_last_visit").on(table.lastVisitTime),
    index("idx_history_typed_count").on(table.typedCount)
  ]
);

export type HistoryRow = typeof history.$inferSelect;
export type HistoryInsert = typeof history.$inferInsert;
