CREATE TABLE `article_follows` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`article_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `article_follows_id` PRIMARY KEY(`id`),
	CONSTRAINT `article_follows_user_article_idx` UNIQUE(`user_id`,`article_id`)
);
--> statement-breakpoint
ALTER TABLE `comments` ADD `edited_at` datetime;--> statement-breakpoint
CREATE INDEX `article_follows_article_idx` ON `article_follows` (`article_id`);