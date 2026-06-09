CREATE TABLE `ban_filters` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`type` enum('email','ip','name') NOT NULL,
	`content` varchar(255) NOT NULL,
	`reason` varchar(255) NOT NULL DEFAULT '',
	`actor_id` bigint,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `ban_filters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ban_filters_type_idx` ON `ban_filters` (`type`);