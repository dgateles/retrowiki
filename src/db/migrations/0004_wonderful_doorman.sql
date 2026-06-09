CREATE TABLE `article_views` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`article_id` bigint NOT NULL,
	`viewer_key` varchar(64) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `article_views_id` PRIMARY KEY(`id`),
	CONSTRAINT `article_views_article_viewer_idx` UNIQUE(`article_id`,`viewer_key`)
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `views_count` int DEFAULT 0 NOT NULL;