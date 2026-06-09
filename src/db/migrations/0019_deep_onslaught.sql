CREATE TABLE `reactions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(60) NOT NULL,
	`emoji` varchar(16) NOT NULL DEFAULT '👍',
	`weight` int NOT NULL DEFAULT 1,
	`enabled` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reputation_levels` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`title` varchar(80) NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`badge` varchar(80),
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `reputation_levels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `votes` ADD `reaction_id` bigint;--> statement-breakpoint
CREATE INDEX `reactions_order_idx` ON `reactions` (`sort_order`);--> statement-breakpoint
CREATE INDEX `rep_levels_points_idx` ON `reputation_levels` (`points`);