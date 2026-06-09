CREATE TABLE `member_ips` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`ip` varchar(45) NOT NULL,
	`user_agent` varchar(400),
	`uses` int NOT NULL DEFAULT 1,
	`first_used_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`last_used_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `member_ips_id` PRIMARY KEY(`id`),
	CONSTRAINT `member_ips_user_ip_idx` UNIQUE(`user_id`,`ip`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `last_seen_at` datetime;--> statement-breakpoint
CREATE INDEX `member_ips_ip_idx` ON `member_ips` (`ip`);