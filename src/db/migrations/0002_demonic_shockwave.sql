CREATE TABLE `badges` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` varchar(300) NOT NULL,
	`icon` varchar(40) NOT NULL DEFAULT 'award',
	`tier` enum('bronze','silver','gold') NOT NULL DEFAULT 'bronze',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`badge_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_badge_idx` UNIQUE(`user_id`,`badge_id`)
);
--> statement-breakpoint
CREATE INDEX `user_badges_user_idx` ON `user_badges` (`user_id`);