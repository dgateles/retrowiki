CREATE TABLE `user_follows` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`follower_id` bigint NOT NULL,
	`followed_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_follows_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_follows_pair_idx` UNIQUE(`follower_id`,`followed_id`)
);
--> statement-breakpoint
CREATE INDEX `user_follows_follower_idx` ON `user_follows` (`follower_id`);--> statement-breakpoint
CREATE INDEX `user_follows_followed_idx` ON `user_follows` (`followed_id`);