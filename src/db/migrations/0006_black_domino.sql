CREATE TABLE `promotion_rules` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`criteria` json NOT NULL,
	`target_role` varchar(20) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `promotion_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `promotion_rules_order_idx` ON `promotion_rules` (`sort_order`);