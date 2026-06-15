CREATE TABLE `comment_reactions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`comment_id` bigint NOT NULL,
	`value` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `comment_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `comment_reactions_user_comment_idx` UNIQUE(`user_id`,`comment_id`)
);
--> statement-breakpoint
CREATE INDEX `comment_reactions_comment_idx` ON `comment_reactions` (`comment_id`);