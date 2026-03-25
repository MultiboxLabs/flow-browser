import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { NavigationEntry, TabGroupMode } from "~/types/tabs";

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

// --- Pinned Tabs Table ---

export const pinnedTabs = sqliteTable(
  "pinned_tabs",
  {
    uniqueId: text("unique_id").primaryKey(),
    profileId: text("profile_id").notNull(),
    defaultUrl: text("default_url").notNull(),
    faviconUrl: text("favicon_url"),
    position: integer("position").notNull()
  },
  (table) => [index("idx_pinned_tabs_profile_id").on(table.profileId)]
);

export type PinnedTabRow = typeof pinnedTabs.$inferSelect;
export type PinnedTabInsert = typeof pinnedTabs.$inferInsert;

// --- Browsing history (Chromium-inspired urls + visits; see design/chromium-inspired-browsing-history.md) ---

export const historyUrls = sqliteTable(
  "history_urls",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    profileId: text("profile_id").notNull(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    visitCount: integer("visit_count").notNull().default(0),
    typedCount: integer("typed_count").notNull().default(0),
    lastVisitTime: integer("last_visit_time").notNull()
  },
  (table) => [uniqueIndex("idx_history_urls_profile_url").on(table.profileId, table.url)]
);

export const historyVisits = sqliteTable(
  "history_visits",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    urlId: integer("url_id")
      .notNull()
      .references(() => historyUrls.id, { onDelete: "cascade" }),
    visitTime: integer("visit_time").notNull(),
    typed: integer("typed", { mode: "boolean" }).notNull().default(false)
  },
  (table) => [
    index("idx_history_visits_url_id").on(table.urlId),
    index("idx_history_visits_visit_time").on(table.visitTime)
  ]
);

export type HistoryUrlRow = typeof historyUrls.$inferSelect;
export type HistoryVisitRow = typeof historyVisits.$inferSelect;
