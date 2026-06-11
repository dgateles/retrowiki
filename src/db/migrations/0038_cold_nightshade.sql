CREATE TABLE `menu_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`location` enum('header','footer') NOT NULL DEFAULT 'header',
	`label` varchar(80) NOT NULL,
	`href` varchar(300),
	`type` enum('link','flyout','dropdown') NOT NULL DEFAULT 'link',
	`parent_id` bigint,
	`icon` varchar(40),
	`description` varchar(200),
	`sort_order` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `menu_items_tree_idx` ON `menu_items` (`location`,`parent_id`,`sort_order`);