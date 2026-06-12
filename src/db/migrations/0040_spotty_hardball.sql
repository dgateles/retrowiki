CREATE TABLE `member_albums` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`title` varchar(120) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `member_albums_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `content_reports` MODIFY COLUMN `target_type` enum('article','comment','photo') NOT NULL;--> statement-breakpoint
ALTER TABLE `member_photos` ADD `album_id` bigint;--> statement-breakpoint
ALTER TABLE `member_photos` ADD `hidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `member_albums_user_idx` ON `member_albums` (`user_id`,`sort_order`);