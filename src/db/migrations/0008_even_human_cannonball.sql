CREATE TABLE `achievement_rules` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`trigger` varchar(40) NOT NULL,
	`milestone` int NOT NULL DEFAULT 0,
	`enabled` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`rewards` json NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `achievement_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `achievement_rules_trigger_idx` ON `achievement_rules` (`trigger`);