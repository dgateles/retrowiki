CREATE TABLE `content_reports` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`reporter_id` bigint NOT NULL,
	`target_type` enum('article','comment') NOT NULL,
	`target_id` bigint NOT NULL,
	`report_type_id` bigint NOT NULL,
	`message` varchar(1000) NOT NULL DEFAULT '',
	`status` enum('open','completed','rejected') NOT NULL DEFAULT 'open',
	`resolved_by_id` bigint,
	`resolved_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `content_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_reports_unique_idx` UNIQUE(`reporter_id`,`target_type`,`target_id`)
);
--> statement-breakpoint
CREATE TABLE `report_types` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`title` varchar(120) NOT NULL,
	`completed_notification` text,
	`rejected_notification` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `report_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `content_reports_target_idx` ON `content_reports` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `content_reports_status_idx` ON `content_reports` (`status`);--> statement-breakpoint
CREATE INDEX `report_types_order_idx` ON `report_types` (`sort_order`);