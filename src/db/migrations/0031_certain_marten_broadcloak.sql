CREATE TABLE `announcements` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`message` varchar(500) NOT NULL,
	`variant` enum('info','warning','success') NOT NULL DEFAULT 'info',
	`link_url` varchar(300) NOT NULL DEFAULT '',
	`link_label` varchar(80) NOT NULL DEFAULT '',
	`active` boolean NOT NULL DEFAULT true,
	`created_by_id` bigint,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `announcements_active_idx` ON `announcements` (`active`);