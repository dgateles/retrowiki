CREATE TABLE `staff_categories` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`title` varchar(120) NOT NULL,
	`layout` enum('grid','list','twocol') NOT NULL DEFAULT 'grid',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `staff_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_entries` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`category_id` bigint NOT NULL,
	`type` enum('member','group') NOT NULL,
	`member_id` bigint,
	`group_role` varchar(20),
	`custom_name` varchar(120) NOT NULL DEFAULT '',
	`custom_title` varchar(160) NOT NULL DEFAULT '',
	`bio` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `staff_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `staff_categories_order_idx` ON `staff_categories` (`sort_order`);--> statement-breakpoint
CREATE INDEX `staff_entries_cat_idx` ON `staff_entries` (`category_id`,`sort_order`);