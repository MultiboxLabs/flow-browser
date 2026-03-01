CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`parent_folder_id` integer,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`is_folder` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bookmarks_url` ON `bookmarks` (`url`);--> statement-breakpoint
CREATE INDEX `idx_bookmarks_parent` ON `bookmarks` (`parent_folder_id`);--> statement-breakpoint
CREATE TABLE `omnibox_shortcuts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`input_text` text NOT NULL,
	`destination_url` text NOT NULL,
	`destination_title` text DEFAULT '' NOT NULL,
	`match_type` text NOT NULL,
	`hit_count` integer DEFAULT 1 NOT NULL,
	`last_access_time` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_omnibox_shortcuts_input` ON `omnibox_shortcuts` (`input_text`);--> statement-breakpoint
CREATE INDEX `idx_omnibox_shortcuts_destination` ON `omnibox_shortcuts` (`destination_url`);