-- Per-visit typed flag (accurate typed_count after deletes/prune) + FK on url_id.
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_history_visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url_id` integer NOT NULL REFERENCES `history_urls`(`id`) ON DELETE CASCADE,
	`visit_time` integer NOT NULL,
	`typed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_history_visits` (`id`, `url_id`, `visit_time`, `typed`)
SELECT `id`, `url_id`, `visit_time`, 0 FROM `history_visits`;
--> statement-breakpoint
DROP TABLE `history_visits`;
--> statement-breakpoint
ALTER TABLE `__new_history_visits` RENAME TO `history_visits`;
--> statement-breakpoint
CREATE INDEX `idx_history_visits_url_id` ON `history_visits` (`url_id`);
--> statement-breakpoint
CREATE INDEX `idx_history_visits_visit_time` ON `history_visits` (`visit_time`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
UPDATE `history_visits` SET `typed` = 1 WHERE `id` IN (
	WITH ranked AS (
		SELECT
			v.id AS vid,
			u.typed_count AS tc,
			ROW_NUMBER() OVER (
				PARTITION BY v.url_id ORDER BY v.visit_time DESC, v.id DESC
			) AS rn
		FROM history_visits AS v
		INNER JOIN history_urls AS u ON u.id = v.url_id
	)
	SELECT vid FROM ranked WHERE tc > 0 AND rn <= tc
);
