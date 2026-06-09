CREATE TABLE `user_warnings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`reason_id` bigint,
	`reason_name` varchar(120) NOT NULL DEFAULT '',
	`points` int NOT NULL DEFAULT 0,
	`note` varchar(500) NOT NULL DEFAULT '',
	`issued_by_id` bigint,
	`acknowledged` boolean NOT NULL DEFAULT false,
	`expires_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_warnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warning_actions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`points` int NOT NULL,
	`restrict_hours` int NOT NULL DEFAULT 0,
	`ban_hours` int NOT NULL DEFAULT 0,
	`moderate_hours` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `warning_actions_id` PRIMARY KEY(`id`),
	CONSTRAINT `warning_actions_points_idx` UNIQUE(`points`)
);
--> statement-breakpoint
CREATE TABLE `warning_reasons` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`points` int NOT NULL DEFAULT 1,
	`remove_after_hours` int,
	`deduct_reputation` int NOT NULL DEFAULT 0,
	`default_note` varchar(500) NOT NULL DEFAULT '',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `warning_reasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `posting_restricted_until` datetime;--> statement-breakpoint
CREATE INDEX `user_warnings_user_idx` ON `user_warnings` (`user_id`);--> statement-breakpoint
CREATE INDEX `warning_reasons_order_idx` ON `warning_reasons` (`sort_order`);