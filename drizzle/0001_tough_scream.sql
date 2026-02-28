CREATE TABLE `pinned_tabs` (
	`unique_id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`default_url` text NOT NULL,
	`favicon_url` text,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_pinned_tabs_profile_id` ON `pinned_tabs` (`profile_id`);