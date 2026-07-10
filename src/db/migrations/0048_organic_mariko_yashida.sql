CREATE TABLE `user_ignores` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`ignored_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_ignores_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_ignores_pair_idx` UNIQUE(`user_id`,`ignored_id`)
);
--> statement-breakpoint
CREATE INDEX `user_ignores_user_idx` ON `user_ignores` (`user_id`);