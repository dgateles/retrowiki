CREATE TABLE `pages` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`title` varchar(200) NOT NULL,
	`meta_description` varchar(320),
	`layout` json NOT NULL,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`show_in_menu` boolean NOT NULL DEFAULT false,
	`menu_order` int NOT NULL DEFAULT 0,
	`noindex` boolean NOT NULL DEFAULT false,
	`created_by_id` bigint,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `pages_menu_idx` ON `pages` (`show_in_menu`,`menu_order`);