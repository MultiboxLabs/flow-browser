CREATE TABLE `history_urls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`visit_count` integer DEFAULT 0 NOT NULL,
	`typed_count` integer DEFAULT 0 NOT NULL,
	`last_visit_time` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_history_urls_profile_url` ON `history_urls` (`profile_id`,`url`);
--> statement-breakpoint
CREATE TABLE `history_visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url_id` integer NOT NULL,
	`visit_time` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_history_visits_url_id` ON `history_visits` (`url_id`);
--> statement-breakpoint
CREATE INDEX `idx_history_visits_visit_time` ON `history_visits` (`visit_time`);
