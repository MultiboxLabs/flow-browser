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
