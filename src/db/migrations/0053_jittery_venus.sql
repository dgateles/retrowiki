CREATE TABLE `forum_prefixes` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`label` varchar(40) NOT NULL,
	`slug` varchar(60) NOT NULL,
	`color` enum('slate','red','orange','amber','green','teal','blue','violet','pink') NOT NULL DEFAULT 'slate',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `forum_prefixes_id` PRIMARY KEY(`id`),
	CONSTRAINT `forum_prefixes_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `forum_topics` ADD `prefix_id` bigint;