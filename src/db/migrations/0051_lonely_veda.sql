CREATE TABLE `stock_replies` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`title` varchar(120) NOT NULL,
	`body` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `stock_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `stock_replies_sort_idx` ON `stock_replies` (`sort_order`);