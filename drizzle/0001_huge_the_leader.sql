CREATE TABLE `history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`visit_count` integer DEFAULT 1 NOT NULL,
	`typed_count` integer DEFAULT 0 NOT NULL,
	`last_visit_time` integer NOT NULL,
	`first_visit_time` integer NOT NULL,
	`last_visit_type` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_history_url` ON `history` (`url`);--> statement-breakpoint
CREATE INDEX `idx_history_last_visit` ON `history` (`last_visit_time`);--> statement-breakpoint
CREATE INDEX `idx_history_typed_count` ON `history` (`typed_count`);