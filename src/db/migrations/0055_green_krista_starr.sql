CREATE TABLE `forum_attachments` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`post_id` bigint NOT NULL,
	`url` varchar(500) NOT NULL,
	`filename` varchar(200) NOT NULL,
	`content_type` varchar(100) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `forum_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `forum_attachments_post_idx` ON `forum_attachments` (`post_id`);