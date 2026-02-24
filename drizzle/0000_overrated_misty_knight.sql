CREATE TABLE `recently_closed` (
	`unique_id` text PRIMARY KEY NOT NULL,
	`closed_at` integer NOT NULL,
	`tab_data` text NOT NULL,
	`tab_group_data` text
);
--> statement-breakpoint
CREATE INDEX `idx_recently_closed_closed_at` ON `recently_closed` (`closed_at`);--> statement-breakpoint
CREATE TABLE `tab_groups` (
	`group_id` text PRIMARY KEY NOT NULL,
	`mode` text NOT NULL,
	`profile_id` text NOT NULL,
	`space_id` text NOT NULL,
	`tab_unique_ids` text NOT NULL,
	`glance_front_tab_unique_id` text,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tabs` (
	`unique_id` text PRIMARY KEY NOT NULL,
	`schema_version` integer NOT NULL,
	`created_at` integer NOT NULL,
	`last_active_at` integer NOT NULL,
	`position` integer NOT NULL,
	`profile_id` text NOT NULL,
	`space_id` text NOT NULL,
	`window_group_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`favicon_url` text,
	`muted` integer NOT NULL,
	`nav_history` text NOT NULL,
	`nav_history_index` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tabs_window_group_id` ON `tabs` (`window_group_id`);--> statement-breakpoint
CREATE TABLE `window_states` (
	`window_group_id` text PRIMARY KEY NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`x` integer,
	`y` integer,
	`is_popup` integer
);
