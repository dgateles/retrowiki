CREATE TABLE `ranks` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`title` varchar(80) NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`icon` varchar(40) NOT NULL DEFAULT 'Shield',
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `ranks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ranks_points_idx` ON `ranks` (`points`);