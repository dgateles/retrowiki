CREATE TABLE `member_photos` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`url` varchar(500) NOT NULL,
	`caption` varchar(200) NOT NULL DEFAULT '',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `member_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `member_photos_user_idx` ON `member_photos` (`user_id`,`sort_order`);