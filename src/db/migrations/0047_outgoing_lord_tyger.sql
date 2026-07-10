CREATE TABLE `forum_tags` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(60) NOT NULL,
	`slug` varchar(70) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `forum_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `forum_tags_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `forum_topic_tags` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`topic_id` bigint NOT NULL,
	`tag_id` bigint NOT NULL,
	CONSTRAINT `forum_topic_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `forum_topic_tags_idx` UNIQUE(`topic_id`,`tag_id`)
);
--> statement-breakpoint
CREATE INDEX `forum_topic_tags_tag_idx` ON `forum_topic_tags` (`tag_id`);