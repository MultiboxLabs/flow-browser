CREATE TABLE `downloads` (
	`id` text PRIMARY KEY NOT NULL,
	`origin_profile_id` text,
	`url` text NOT NULL,
	`url_chain` text NOT NULL,
	`suggested_filename` text NOT NULL,
	`save_path` text,
	`mime_type` text,
	`state` text NOT NULL,
	`received_bytes` integer DEFAULT 0 NOT NULL,
	`total_bytes` integer DEFAULT 0 NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`etag` text,
	`last_modified` text,
	`can_resume` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_downloads_state` ON `downloads` (`state`);
--> statement-breakpoint
CREATE INDEX `idx_downloads_updated_at` ON `downloads` (`updated_at`);
