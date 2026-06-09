CREATE TABLE `profile_field_groups` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `profile_field_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profile_field_values` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`field_id` bigint NOT NULL,
	`value` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `profile_field_values_id` PRIMARY KEY(`id`),
	CONSTRAINT `pfv_user_field_idx` UNIQUE(`user_id`,`field_id`)
);
--> statement-breakpoint
CREATE TABLE `profile_fields` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`group_id` bigint NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` varchar(300) NOT NULL DEFAULT '',
	`type` varchar(20) NOT NULL DEFAULT 'text',
	`options` json,
	`required` boolean NOT NULL DEFAULT false,
	`max_length` int,
	`regex` varchar(255),
	`show_on_register` boolean NOT NULL DEFAULT false,
	`member_editable` boolean NOT NULL DEFAULT true,
	`visibility` enum('none','staff','staff_owner','all') NOT NULL DEFAULT 'all',
	`pii` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `profile_fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `pfg_order_idx` ON `profile_field_groups` (`sort_order`);--> statement-breakpoint
CREATE INDEX `pf_group_idx` ON `profile_fields` (`group_id`);--> statement-breakpoint
CREATE INDEX `pf_order_idx` ON `profile_fields` (`sort_order`);