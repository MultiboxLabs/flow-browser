CREATE TABLE IF NOT EXISTS `pinned_tabs` (
	`unique_id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`default_url` text NOT NULL,
	`favicon_url` text,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_pinned_tabs_profile_id` ON `pinned_tabs` (`profile_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `history_urls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`visit_count` integer DEFAULT 0 NOT NULL,
	`typed_count` integer DEFAULT 0 NOT NULL,
	`last_visit_time` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_history_urls_profile_url` ON `history_urls` (`profile_id`,`url`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `history_visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url_id` integer NOT NULL REFERENCES `history_urls`(`id`) ON DELETE CASCADE,
	`visit_time` integer NOT NULL,
	`typed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_history_visits_url_id` ON `history_visits` (`url_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_history_visits_visit_time` ON `history_visits` (`visit_time`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`parent_folder_id` integer,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`is_folder` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_bookmarks_url` ON `bookmarks` (`url`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_bookmarks_parent` ON `bookmarks` (`parent_folder_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `omnibox_shortcuts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`input_text` text NOT NULL,
	`destination_url` text NOT NULL,
	`destination_title` text DEFAULT '' NOT NULL,
	`match_type` text NOT NULL,
	`hit_count` integer DEFAULT 1 NOT NULL,
	`last_access_time` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_omnibox_shortcuts_input` ON `omnibox_shortcuts` (`input_text`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_omnibox_shortcuts_destination` ON `omnibox_shortcuts` (`destination_url`);
--> statement-breakpoint
DROP TABLE IF EXISTS `history`;
